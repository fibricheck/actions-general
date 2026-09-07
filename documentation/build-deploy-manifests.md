# Build & deploy manifests — design plan

## Background

Two tickets ask for traceability records on every schema release/deploy — component/version, commit SHA, product identifiers, UDI for the build; a reference back to the build, target environment, timestamp for the deploy. This is MDR (medical device) context. There is a **separate, existing release process** that already covers approval sign-off, risk/change-impact assessment, and verification evidence — this manifest system is not trying to reimplement any of that. Its job is narrower and specific: be trustworthy *proof* that a given build/deployment actually happened, in enough detail that the separate release process can reference it as evidence. Anything that belongs to that other process (approver identity, risk classification, verification records, UDI-DI/UDI-PI) stays there, not here.

## Build manifest vs deploy manifest — why they're not the same thing

A build manifest records that *something was produced*. A deploy manifest records that *a specific already-built artifact was put into service somewhere*. Whether that's 1:1 or 1:many depends entirely on how the consuming repo actually builds:

- **`fibricheck-schemas`**: genuinely 1:many. No build-time config injection — the schema JSON produced by `release-schema.yml` is a single artifact that can be deployed to `eu-production` today and `us-production` next month without being rebuilt.
- **`fibricheck_react_native`**: effectively 1:1 per platform, but *not* strictly 1:1 overall — a version+region+platform combination can have *multiple build attempts* (e.g. a rebuild after an App Store rejection) but only ever *one* deployment, since region/environment config (`config.eu.prod.json` vs `config.us.prod.json`) is baked in at build time, making the EU build and the US build different artifacts from the start, not one artifact deployed twice. iOS and Android are two independent build artifacts with independent review timelines too, not variants of one build.

The actions themselves (`generate-build-manifest`/`generate-deploy-manifest`) don't assume either shape — they just write independent files. The relationship is entirely a calling-workflow/naming-convention decision, and differs per repo.

## Storage: S3, not git

Manifests are **not** committed to a git repo.

1. **Tamper-evidence.** A git-committed file is just a file — nothing stops someone editing it in a later commit, and while the edit is discoverable in git history, nothing actually *prevents* it. S3 Object Lock (WORM — write-once-read-many) gives a real, enforced guarantee: an object can be made genuinely unmodifiable and undeletable for a configured retention period, even against an account with admin rights, and it's per-object — the build manifest can be locked the moment it's written and the deploy manifest locked independently, weeks later.
2. **A dedicated bucket.** `manifests.fibricheck.com` is a separate, purpose-built bucket, created with Object Lock (and the Versioning it requires) enabled from the start. `builds.fibricheck.com` — where Android `.apk` builds land — is untouched by this and keeps working exactly as it does today (binaries only, `public-read`, no Object Lock). The top-level folders inside `manifests.fibricheck.com` are `app`, `pages`, `schemas`, `tasks`, `packages` (shared/native SDKs not tied to one of the other four, e.g. the camera SDKs), and `test` (for exercising the upload path without mixing test data into real evidence — it is **not** a way to get objects that can be freely deleted: Object Lock doesn't care which folder an object is in, and the bucket's default retention rule applies to every object regardless of folder).

Manifest objects in `manifests.fibricheck.com` are private (Block Public Access on, ACLs disabled) — no `public-read`, unlike `builds.fibricheck.com`'s binaries. Anything that needs to fetch a known manifest or discover a folder's contents (the separate release process or an internal tool) uses authenticated AWS/IAM access.

The verification procedure for a stored manifest stays intentionally simple: confirm that the expected object exists, that Object Lock is active for it, and that its S3 creation/`LastModified` timestamp matches the recorded build or deployment time as defined by the release procedure. No S3 version ID or extra content digest is added to the manifest.

### `manifests.fibricheck.com` — what's actually configured

- **Region**: `eu-central-1`, matching `builds.fibricheck.com` and the existing GH Actions jobs that will call these actions.
- **Object Lock + Versioning**: enabled at creation, permanently — neither can be disabled for this bucket.
- **Access**: Block all public access on, ACLs disabled (bucket owner enforced) — nothing in this bucket is ever public-read.
- **Encryption**: SSE-S3 (default).
- **Bucket-level default Object Lock retention**: this is the *only* place retention is configured — the actions themselves have no retention inputs, so every upload inherits whatever the bucket's default retention rule says, with no way to override it per call. Configured as `GOVERNANCE` mode, 10 years.
- **IAM**: role `manifestPublishingPolicy` exists, trust policy scoped per-repo to each caller's actual verified production branch, permissions policy limited to `s3:PutObject`/`s3:PutObjectRetention` on the six folder prefixes. Nothing currently calls it.

No S3 upload path exists for iOS at all yet (`.ipa` goes through `xcode-cloud`/App Store Connect only); if iOS manifests need to land in `manifests.fibricheck.com`, that upload path — and the credentials for it — still need to be built from scratch.

## Folder & naming convention (`fibricheck_react_native`)

`builds.fibricheck.com` keeps its existing structure, unaffected by any of this:

```
# builds.fibricheck.com (binaries only, public-read)
app/
  FibriCheck-2.16.0-146-eu-prod.ipa
  FibriCheck-2.16.0-147-eu-prod.ipa                    # rebuilt after App Review rejection
  FibriCheck-2.16.0-89-eu-prod.apk
```

`manifests.fibricheck.com` holds the manifests, with a flat key shape by default:

```
# manifests.fibricheck.com (default, via s3-folder alone)
app/
  fibricheck-app-ios-2.16.0-146.build-manifest.json
  fibricheck-app-ios-2.16.0-147.build-manifest.json     # rebuilt after App Review rejection
  fibricheck-app-android-2.16.0-89.build-manifest.json
  fibricheck-app-ios-2.16.0-eu-production.deploy-manifest.json
  fibricheck-app-android-2.16.0-eu-production.deploy-manifest.json
```

A nested structure (grouped by version+region, platform as a subfolder) is still possible via an explicit `s3-key`, if `fibricheck_react_native` ends up wanting one to mirror the binary layout more closely — not yet decided; whoever wires up `android-build.yml`/the iOS pipeline should pick a convention and keep this doc in sync with it.

- `component` already encodes platform (`fibricheck-app-ios`/`fibricheck-app-android`), so platform doesn't need a subfolder to stay unambiguous — it's in the filename either way.
- Build manifest filenames follow the action's default (`<component>-<version>[-<build-number>]`), not the `FibriCheck-<version>-<buildNumber>-<region>-<type>` binary convention — the two live in different buckets, so filename parity with the `.ipa`/`.apk` isn't load-bearing. `commit.sha` (and `buildId`, best-effort) inside the manifest are what correlate a manifest to a specific build.
- Deploy manifest filenames don't include a build number — which build number actually got deployed is still fully recoverable via the deploy manifest's `buildManifestRef`.

**Dev artifacts are entirely unaffected.** `.apk`/`.ipa` uploads for dev builds continue exactly as they work today — same bucket, same process. The only new, prod-gated thing is manifest generation into `manifests.fibricheck.com`; dev builds never get one.

## Prod-only

Manifests are only generated for production builds (`type: prod`), not dev. Dev builds aren't reaching real users, so they don't need this level of traceability, and skipping them keeps volume down. This should gate the calling workflow step, not the generic action itself.

## Shape

**Build manifest:**

```json
{
  "manifestVersion": "1.0",
  "component": "fibricheck-app-ios",
  "version": "2.16.0",
  "buildNumber": "146",
  "buildId": "4839201756",
  "commit": {
    "repo": "fibricheck/fibricheck_react_native",
    "sha": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    "tag": null
  },
  "productIdentifiers": ["fibricheck-app-ios-v2.16.0-eu-prod"],
  "buildTimestamp": "2026-09-01T09:56:37Z",
  "udi": null,
  "buildConfig": {
    "region": "eu",
    "environment": "prod",
    "FEATURE_ECG": true,
    "ANDROID_CONSUMER_KEY": "abc123"
  },
  "tooling": {
    "runner": { "os": "macOS", "version": "15.6", "architecture": "arm64" },
    "node": "20.19.4",
    "packageManager": { "name": "yarn", "version": "4.9.2" },
    "xcode": "16.4",
    "swift": "6.1.2",
    "cocoapods": "1.16.2"
  }
}
```

**Deploy manifest:**

```json
{
  "manifestVersion": "1.0",
  "buildManifestRef": "s3://manifests.fibricheck.com/app/fibricheck-app-ios-2.16.0-146.build-manifest.json",
  "component": "fibricheck-app-ios",
  "version": "2.16.0",
  "targetEnvironment": "eu-production",
  "deploymentTimestamp": "2026-09-01T10:15:02Z",
  "deployConfig": null
}
```

Notes on individual fields:

- **`component`** encodes platform for the app (`fibricheck-app-ios` / `fibricheck-app-android`) — these are genuinely different build artifacts with independent lifecycles, unlike EU/US which are the same artifact-shape deployed differently. Self-describing regardless of which folder the file sits in.
- **`manifestVersion`** versions the meaning and shape of the manifest independently from the product version. It starts at `1.0` and changes when the manifest contract changes.
- **`buildNumber`** is optional. Mobile builds record it because multiple builds can come from the same commit. Pages and schemas currently have no build number and leave it `null`; their existing `commit.sha` is the build identifier until their process introduces one.
- **`buildId`** is optional, added at QA's request to reference the CI build that produced the artifact (e.g. a GitHub Actions run ID). Best-effort only, not a durable reference — GitHub's workflow-run retention window (90 days as of 2026-10-01) means a stored run ID can stop resolving to anything well within this manifest's own multi-year retention period. `commit.sha` is what actually stays valid regardless of GitHub's retention; anyone investigating a build can still find the CI run by searching Actions history against that SHA even without a stored run ID. The calling workflow supplies `buildId` explicitly — this action never reads GitHub context on its own.
- **`productIdentifiers`** are the logical identifiers of the products/artifacts produced by the build. No separate artifact object, media type, size, checksum, or registry field — this stays a small reference record. Repository-specific identifiers, such as an npm package name/version, can be included in this list.
- **`tooling`** is a JSON object containing the versions of tools actually used for the build. Callers should populate only applicable values and obtain them from the build environment where possible. Typical values are runner OS/architecture, Node and package-manager version; Xcode, Swift, and CocoaPods for iOS; Java, Gradle, Android Gradle Plugin, Android SDK/build tools for Android; and the relevant framework or generator version for pages and schemas.
- **`udi`** contains the complete UDI label produced by the existing domain-specific UDI construction. Its component parts are not duplicated in this reference manifest; the calling repository owns the applicable prefix and constructs the final value before invoking the action.
- **No GitHub run URLs anywhere**, only the best-effort `buildId` — see above for why.
- **`buildManifestRef` is recorded as-is, never read, fetched, or validated.** The build manifest is itself an Object-Locked, tamper-evident S3 object, so the reference is exactly as trustworthy as the thing it points to — embedding a copy would add nothing, and skipping the read/validate step keeps `generate-deploy-manifest` simple and decoupled from the build manifest's storage location or existence at generation time.
- **`buildConfig`/`deployConfig`** embed configuration verbatim, matching whatever shape the source already is — a JSON object when one already exists (`config/config.json`, `cat`'d directly, zero conversion), a raw string otherwise (pages-portal's multi-line `KEY=value` `features` input, embedded unparsed). Never build/publish-only secrets — only values that already ship inside the built artifact. Verified concretely for `fibricheck_react_native`: `CONSUMER_KEY`/`CONSUMER_SECRET`/`CLIENT_ID` are read by app runtime code (`src/utils/sdk/index.ts`) to sign live API calls, so they ship in the `.apk`/`.ipa` in plaintext already (extractable with `unzip`, no decompilation needed) — writing them into a private manifest doesn't newly expose anything. Because those values should not appear in CI logs, production workflows must never print `manifest-json` or the manifest file contents; they should log only its path or storage key.
- **No `steps`, `approver`, or `outcome` fields.** `commit.sha` already makes the build process fully recoverable (check out that commit, read the workflow file as it existed then), so a hand-maintained steps list would only duplicate that. Approval belongs to the separate release process this manifest feeds into. Outcome is redundant — a deploy manifest only ever gets generated after a deploy actually succeeds, so its existence *is* the success signal.
- **`deploymentTimestamp` isn't store-verified.** For a manual app-store release (see "Manual invocation" below) it's whatever the human running the workflow typed in or the moment they triggered it — not independently confirmed against App Store Connect / Play Console, since neither API reliably exposes a true "went live" time (see below). Treat it as "when someone recorded this deployment," not "when the store actually made it live."

## Where they get built (`fibricheck-schemas`, still git-committed for now)

**Build manifest**: `release-schema.yml`, right after the existing "Record release SHA" step — `RELEASE_SHA` is already known there (that's the reason the two-commit sha-patch pattern exists), so no circularity. Committed alongside the existing sha-patch commit.

**Deploy manifest**: `deploy-production.yml`, after `deploy-schema` succeeds. This workflow currently makes no git writes at all, so this is a genuinely new step.

**Dependency worth restating**: `fibricheck-schemas`'s sha-tracking (both `release.json`'s and the build manifest's `commit.sha`) only stays valid if release PRs are merged with "Create a merge commit" — squash/rebase mint a new hash, and with `delete_branch_on_merge: true` the original commit becomes unreachable and eventually garbage-collected. Still outstanding. This dependency does *not* apply to the S3-based `fibricheck_react_native` approach — an S3 object's integrity doesn't depend on git commit reachability the same way, though `commit.sha` inside the manifest is still only as trustworthy as that same merge-strategy guarantee if someone tries to check it out later.

**Also worth flagging**: because `s3-folder` is a mandatory input on both actions (see below), `fibricheck-schemas` uploading to `manifests.fibricheck.com` isn't optional the moment it calls either action — there's no git-only path left to choose, regardless of whether moving off git-committed manifests was separately decided. Worth being explicit about this with whoever wires up `release-schema.yml`/`deploy-production.yml`.

## Generic actions (`fibricheck/actions-general`)

`generate-build-manifest` and `generate-deploy-manifest` (verb-first naming — "build-manifest"/"deploy-manifest" read as "a manifest of building/deploying a manifest"). Both composite/bash, tested against real scenarios (JSON `build-config`, raw-text `build-config` with an embedded `=`, all-empty optional fields, a `build-manifest-ref` pointing at a non-existent path, path-traversal/line-break rejection, S3 upload against a mocked `aws` CLI since CI has no real bucket or credentials), wired into `on-pull-request.yml` for `act`-based CI testing.

Each takes structured inputs and **produces JSON as output** (file + step output), writes the manifest locally, and uploads it to `manifests.fibricheck.com`. `s3-folder` (`app`/`pages`/`schemas`/`tasks`/`packages`/`test`) is a **required** input on both actions — every call uploads, there is no local-file-only mode and no way to opt out. The bucket is hardcoded directly in the action's script; there is no `s3-bucket` input and no way to point either action at a different bucket. Since IAM already scopes the publisher role's credentials to `manifests.fibricheck.com` specifically, this isn't closing a security hole (a different bucket name would just get `AccessDenied`) — it's a simplicity call: one bucket, no override, no "why did this try to upload somewhere else" failure mode to debug. The local write path is likewise always computed internally (`manifests/build/<component>-<version>.json` / `manifests/deploy/<component>/<version>-<target-environment>-<timestamp>.json`) with no way to override it — it's just where the file lands before upload, nothing has ever needed a different one.

The default S3 key is `<s3-folder>/<component>-<version>[-<build-number>].build-manifest.json` for the build manifest and `<s3-folder>/<component>-<version>-<target-environment>.deploy-manifest.json` for the deploy manifest; an explicit `s3-key` overrides this. `generate-deploy-manifest`'s `build-manifest-ref` is recorded as-is — it doesn't read, fetch, or validate the thing it points to (see the field notes above).

`build-config`/`deploy-config` auto-detect shape: if the input is valid JSON, it's embedded as-is (an object); otherwise it's wrapped as a JSON string, unparsed. Callers never need a separate conversion step for either case. `tooling` accepts a JSON object and fails when a non-object or invalid JSON value is supplied — intentionally separate from `build-config`: build configuration describes the product's behaviour, tooling describes the environment that produced it.

Object Lock retention is applied entirely by the bucket's own default retention rule (see "Storage" above) — neither action has a retention input. The action does not enable Object Lock or Versioning on the bucket itself, and will simply fail at upload time if the bucket isn't already configured for it.

Composite-action inputs are passed into Bash through step-level environment variables, not interpolated directly into shell source:

```yaml
env:
  INPUT_BUILD_CONFIG: ${{ inputs.build-config }}
run: |
  BUILD_CONFIG_INPUT="$INPUT_BUILD_CONFIG"
```

GitHub evaluates `${{ inputs.* }}` before Bash parses a `run` block, so interpolating an input directly into shell source can break on ordinary values such as apostrophes and can turn crafted text into executable syntax; the environment variable is the safe boundary between the action input and its Bash implementation. This remains fully compatible with manual `workflow_dispatch` inputs.

Fields used to construct the S3 key or local path (`component`, `version`, `target-environment`, `build-number`, `s3-key`) reject `/`, `\`, exact `.`/`..`, and line breaks. An explicitly supplied `deployment-timestamp` must use the UTC `YYYY-MM-DDTHH:MM:SSZ` format. These checks keep manual inputs from changing the generated path or corrupting the GitHub output file while still allowing ordinary punctuation and shell-like text as literal data everywhere else.

## Manual invocation (`fibricheck_react_native` deploy manifest)

App Store / Play Store deployments happen outside GitHub entirely — no CI step observes "the release actually went live." `generate-deploy-manifest` needs to work with hand-typed inputs via a `workflow_dispatch` form for this case: `deployment-timestamp` is an explicit optional input, defaulting to "now" (the moment the human runs the workflow) rather than any store-verified release time — easy to misread as a confirmed release timestamp, so worth calling out. `build-manifest-ref` should be derived from `component`+`version`+`buildNumber` by the calling workflow (matching the S3 key convention above), not typed freehand by whoever triggers the dispatch.

Neither the App Store Connect nor Google Play Developer API exposes a reliable "went live" timestamp — Apple's `earliestReleaseDate` is a scheduling constraint, not an actual release record, and Google Play's release status/rollout history lives in the Play Console UI, not as an explicit API field. A polling-based approximation (a scheduled workflow checking status periodically, triggering `generate-deploy-manifest` the moment it first observes "live"/"completed") would beat pure manual entry, but is meaningfully more infrastructure than what's built so far — a future improvement, not in scope yet. The `xcode-cloud` action in `actions-general` already holds App Store Connect API credentials for build-triggering, which may be reusable for this without new auth setup; not verified whether Play Store side has an equivalent reusable credential.
