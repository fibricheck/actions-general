# FibriCheck General Actions V1

A collection of general use actions

## Versioning

All actions in this repo share one set of tags (`v1`, `v2`, `v3`, ...). Pin to the major tag in your workflows, for example:

```yaml
uses: fibricheck/actions-general/setup-node-env@v5
```

The major tag moves forward automatically as fixes and features land, so you get updates for free without ever touching your workflow file. If you'd rather hard-pin an exact version, patch tags like `v5.1` are still there for you x.

### Releasing

```bash
git tag v5.2 <commit>
git tag -f v5 <commit>
git push origin v5.2
git push -f origin v5
```

## parse-tag
<!-- start usage -->
```yaml
- name: Parse Tag
  id: parse-tag
  uses: fibricheck/actions-general/parse-tag@v5
  with:
    # The tag to parse. For example, refs/tags/v2.11.0/eu/dev
    # required
    tag: ''

  # The parse-tag action has 3 outputs: version, variant and type.
  # refs/tags/v<version>/<variant>/<type>
  #
  # For example, refs/tags/v2.11.0/eu/dev
  #     version: 2.11.0
  #     variant: eu
  #     type: dev
  #
  # If a certain part is omitted it will become an empty string
  # For example, refs/tags/v2.11.0/eu
  #     version: 2.11.0
  #     variant: eu
  #     type: <empty string>
- name: Echo
  run: |
    echo "version number: ${{ steps.parse-tag.outputs.version }}"
    echo "variant: ${{ steps.parse-tag.outputs.variant }}"
    echo "type: ${{ steps.parse-tag.outputs.type }}"
```
<!-- end usage -->

- [Example](./parse-tag/example.yml)

## regex-match

<!-- start usage -->
```yaml
- name: Regex Match
  id: regex-match
  uses: fibricheck/actions-general/regex-match@v5
  with:
    # The string to check with the regex
    # required
    target: ''
    # The regex string
    # required
    regex: ''
    # Sets the global flag for the regex match
    # optional (default: false)
    global: false
    # Sets the case-insensitive flag for the regex match
    # optional (default: false)
    case-insensitive: false
    # Sets the multi-line flag for the regex match
    # optional (default: false)
    multiline: false

  # Outputs:
  #   matches: Was there a regex match (true/false)
  #   group1-group9: The capture groups from the regex match
- name: Echo
  run: |
    echo "matches: ${{ steps.regex-match.outputs.matches }}"
    echo "group1: ${{ steps.regex-match.outputs.group1 }}"
    echo "group2: ${{ steps.regex-match.outputs.group2 }}"
```
<!-- end usage -->

## xcode-cloud

<!-- start usage -->
```yaml
- name: XCode Cloud
  id: xcode-cloud
  uses: fibricheck/actions-general/xcode-cloud@v5
  with:
    # AppStore Issuer ID
    # required
    appstore-issuer-id: ''
    # AppStore Private Key ID
    # required
    appstore-private-key-id: ''
    # AppStore Private Key
    # required
    appstore-private-key: ''
    # The bundle id of the app as on the app store
    # required
    appstore-bundle-id: ''
    # Name of the XCode Cloud workflow
    # required
    workflow-name: ''
    # Git reference to build
    # required
    git-ref: ''

  # Outputs:
  #   repository-id: The id of the repository used
  #   product-id: The id of the product used
  #   workflow-id: The id of the workflow used
  #   build-id: The id of the build
  #   build-number: The build number
- name: Echo
  run: |
    echo "build-id: ${{ steps.xcode-cloud.outputs.build-id }}"
    echo "build-number: ${{ steps.xcode-cloud.outputs.build-number }}"
```
<!-- end usage -->

## sdk-version-parse

<!-- start usage -->
```yaml
- name: Parse SDK Version
  id: sdk-version-parse
  uses: fibricheck/actions-general/sdk-version-parse@v5
  with:
    # The version string to parse (e.g., v2.13.0, 2.13.0-snapshot.abc1234, v2.13.0-dev.10)
    # required
    version: ''

  # Outputs:
  #   major: The major version number
  #   minor: The minor version number
  #   patch: The patch version number
  #   name: The prerelease name (e.g., dev, alpha, beta)
  #   increment: The prerelease increment number
- name: Echo
  run: |
    echo "major: ${{ steps.sdk-version-parse.outputs.major }}"
    echo "minor: ${{ steps.sdk-version-parse.outputs.minor }}"
    echo "patch: ${{ steps.sdk-version-parse.outputs.patch }}"
    echo "name: ${{ steps.sdk-version-parse.outputs.name }}"
    echo "increment: ${{ steps.sdk-version-parse.outputs.increment }}"
```
<!-- end usage -->

- [Example](./sdk-version-parse/example.yml)

## sdk-release

<!-- start usage -->
```yaml
- name: Release SDK Version
  id: sdk-release
  uses: fibricheck/actions-general/sdk-release@v5
  with:
    # Release type (dev/prod/snapshot)
    # required
    type: ''
    # Github Token
    # required
    token: ''
    # The filename for the release info file
    # optional (default: sdk-release.json)
    release_filename: 'sdk-release.json'
    # Run without making changes
    # optional (default: false)
    dry_run: 'false'

  # Outputs:
  #   tag: The newly created tag (e.g., v2.13.0, v2.13.0-dev.1, v2.13.0-snapshot.abc1234)
  #
  # Notes:
  #   - prod releases must be from main or master branch
  #   - dev releases must be from dev branch
  #   - snapshot releases can be from any branch
  #   - Requires a version file (default: sdk-release.json) with "version" and "releaseDate" fields
- name: Echo
  run: |
    echo "tag: ${{ steps.sdk-release.outputs.tag }}"
```
<!-- end usage -->

- [Example](./sdk-release/example.yml)

## setup-node-env

<!-- start usage -->
```yaml
- name: Setup Node Environment
  id: setup-node-env
  uses: fibricheck/actions-general/setup-node-env@v5
  with:
    # Package manager to use. Allowed values: yarn, npm, pnpm.
    # required
    package-manager: ''
    # Node.js version to install.
    # optional (default: 22)
    node-version: '22'
    # pnpm version to install. Only used when package-manager is pnpm.
    # If omitted, resolved from the "packageManager" field in package.json.
    # optional (default: '')
    pnpm-version: ''
    # Path to the dependency lockfile used for caching.
    # When omitted, dependency caching is disabled.
    # optional (default: '')
    cache-dependency-path: ''
    # GitHub token for authenticating with GitHub Packages. When provided, dependencies are installed.
    # optional (default: '')
    github-token: ''

  # Outputs:
  #   package-manager: Resolved package manager name (yarn, npm, or pnpm)
  #   pm-install: Command to install dependencies
  #   pm-run: Command prefix for running package scripts
- name: Echo
  run: |
    echo "package-manager: ${{ steps.setup-node-env.outputs.package-manager }}"
    echo "pm-install: ${{ steps.setup-node-env.outputs.pm-install }}"
    echo "pm-run: ${{ steps.setup-node-env.outputs.pm-run }}"
```
<!-- end usage -->

- [Example](./setup-node-env/example.yml)

## AWS authentication for manifest actions

`generate-build-manifest` and `generate-deploy-manifest` upload directly to the shared FibriCheck manifests bucket. AWS authentication must happen in the **calling repository**, immediately before invoking the manifest action:

```yaml
permissions:
  contents: read
  id-token: write

steps:
  - name: Authenticate to AWS for manifest publishing
    uses: aws-actions/configure-aws-credentials@v6.2.4
    with:
      role-to-assume: ${{ vars.AWS_MANIFEST_PUBLISHER_ROLE_ARN }}
      aws-region: eu-central-1

  - name: Generate build manifest
    uses: fibricheck/actions-general/generate-build-manifest@v5
    with:
      # ...
```

The manifest actions deliberately do not request an OIDC token, assume a role, or accept AWS credentials. The calling workflow owns the GitHub `id-token: write` permission and is the repository/branch/environment identity evaluated by the AWS trust policy. Keeping authentication there also allows callers to use the appropriate role or AWS account and keeps authentication failures separate from manifest generation and upload failures.

Run input and production-context validation before authenticating so invalid runs do not request AWS credentials unnecessarily.

## generate-build-manifest

Builds a traceability manifest JSON for a release, writes it locally, and uploads it to the shared FibriCheck manifests bucket. It does not commit or push to Git.

<!-- start usage -->
```yaml
- name: Generate Build Manifest
  id: generate-build-manifest
  uses: fibricheck/actions-general/generate-build-manifest@v5
  with:
    # Name of the component or schema that was built
    # required
    component: 'blood-pressure-measurements'
    # Version of the build (e.g. semver)
    # required
    version: '1.0.0'
    # Repository the build came from, owner/name
    # required
    repo: ${{ github.repository }}
    # Commit sha the build was produced from
    # required
    commit-sha: ${{ github.sha }}
    # Git tag for the commit, if one exists
    # optional (default: '')
    commit-tag: 'v1.0.0'
    # Platform build number, when the component has one. Components such as
    # pages and schemas can omit this and use commit-sha as their build identity.
    # optional (default: '')
    build-number: '146'
    # Environment this build was produced for, when applicable. Environment-
    # neutral builds can omit it.
    # optional (default: '')
    target-environment: 'eu-production'
    # CI build identifier (e.g. a GitHub Actions run ID), supplied by the
    # calling workflow — this action does not read GitHub context itself.
    # Best-effort only: GitHub's workflow-run retention window (90 days as of
    # 2026-10-01) means this can stop resolving to anything long before this
    # manifest's own retention period ends. commit-sha remains the durable
    # reference; treat this as a convenience lookup, not a guarantee.
    # optional (default: '')
    build-id: ${{ github.run_id }}
    # Comma-separated list of product identifiers this build produced
    # (e.g. one per target environment)
    # optional (default: '')
    product-identifiers: 'blood-pressure-measurements-v1.0.0-eu-production,blood-pressure-measurements-v1.0.0-us-production'
    # Unique Device Identifier, if applicable
    # optional (default: '')
    udi: '(01)00860001234567(21)A1B2C3'
    # Build-time configuration to embed as-is. Pass a JSON object/string when
    # one already exists (e.g. a config file read with `cat`); pass raw text
    # otherwise (e.g. a multi-line KEY=value block) and it will be embedded as
    # a JSON string, unparsed. Never pass build/publish-only secrets here —
    # only values that already ship inside the built artifact.
    # optional (default: '')
    build-config: '{"region":"eu","environment":"production"}'
    # JSON object with versions of the toolchain actually used for this build.
    # Include only applicable tools, e.g. Node/package manager for pages and
    # Xcode/Swift/CocoaPods or Java/Gradle/AGP for mobile builds.
    # optional (default: '')
    tooling: '{"node":"20.19.4","packageManager":{"name":"yarn","version":"4.9.2"}}'
    # When the build actually happened, as YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ.
    # Defaults to now. Pass this explicitly when recording a build after
    # the fact (e.g. backfilling a manifest for a build that predates this
    # action). A date-only value is normalized to midnight UTC.
    # optional (default: '')
    build-timestamp: ''
    # Top-level folder within the manifests bucket: app, pages, schemas,
    # tasks, packages, or test. Required — every manifest is uploaded, there
    # is no local-only mode. Uploads always go to the shared FibriCheck
    # manifests bucket (manifests.fibricheck.com); there is no way to point
    # this action at a different bucket. The calling job must already have
    # AWS credentials configured (e.g. aws-actions/configure-aws-credentials)
    # — this action does not accept or configure credentials itself. Key
    # defaults to <s3-folder>/<component>/<version>/[<target-environment>.][<build-number>.]<build-timestamp>.build-manifest.json,
    # or s3-key if set. Uploads are create-only and fail if the chosen key
    # already exists. Object Lock retention is applied by the bucket's own
    # default retention rule, not by this action — "test" is not exempt.
    # required
    s3-folder: 'schemas'
    # Object key to upload to within the manifests bucket. If set, used as-is
    # instead of the s3-folder-derived default key. Must not already exist!
    # The upload will fail if it does.
    # optional (default: '')
    s3-key: 'schemas/blood-pressure-measurements/1.0.0/eu-production.2026-09-07T100000Z.build-manifest.json'

  # Outputs:
  #   manifest-json: The generated manifest, as a JSON string
  #   manifest-path: Path the manifest was written to
  #   s3-uri: The s3://bucket/key it was uploaded to
- name: Echo
  run: |
    echo "manifest-path: ${{ steps.generate-build-manifest.outputs.manifest-path }}"
```
<!-- end usage -->

The generated manifest can contain runtime-visible configuration and must not be printed to production logs. Pass it between steps through `manifest-path` or `manifest-json`; only log the path.

- [Example](./generate-build-manifest/example.yml)

## generate-deploy-manifest

Builds a deployment traceability manifest JSON, writes it locally, and uploads it to the shared FibriCheck manifests bucket. It does not commit or push to Git. Only call this after a deploy has actually succeeded — the manifest's existence is itself the success signal, there is no separate outcome field.

<!-- start usage -->
```yaml
- name: Generate Deploy Manifest
  id: generate-deploy-manifest
  uses: fibricheck/actions-general/generate-deploy-manifest@v5
  with:
    # Name of the component or schema that was deployed
    # required
    component: 'blood-pressure-measurements'
    # Version that was deployed
    # required
    version: '1.0.0'
    # Environment this was deployed to (e.g. eu-production, us-prod)
    # required
    target-environment: 'eu-production'
    # Platform build number, when the deployed component has one
    # optional (default: '')
    build-number: '146'
    # Reference to the build manifest for this version — wherever it lives (an
    # S3 URI, a repo path, whatever the caller's storage convention is).
    # Recorded as-is; not read, fetched, or validated, since the build
    # manifest is expected to already be an immutable, trustworthy record on
    # its own.
    # required
    build-manifest-ref: 's3://manifests.fibricheck.com/schemas/blood-pressure-measurements/1.0.0/eu-production.146.2026-09-07T100000Z.build-manifest.json'
    # When the deployment happened, as YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ.
    # Defaults to now. Pass this explicitly when recording a deployment
    # after the fact (e.g. a deploy triggered manually, such as pressing
    # "release" in an app store console). A date-only value is normalized
    # to midnight UTC.
    # optional (default: '')
    deployment-timestamp: '2026-09-07T10:15:02Z'
    # Deploy-time configuration to embed as-is, same rules as
    # generate-build-manifest's build-config: JSON in, JSON out; raw text in,
    # embedded as a JSON string.
    # optional (default: '')
    deploy-config: '{"rolloutPercentage":100}'
    # Top-level folder within the manifests bucket: app, pages, schemas,
    # tasks, packages, or test. Required — every manifest is uploaded, there
    # is no local-only mode. Uploads always go to the shared FibriCheck
    # manifests bucket (manifests.fibricheck.com); there is no way to point
    # this action at a different bucket. The calling job must already have
    # AWS credentials configured (e.g. aws-actions/configure-aws-credentials)
    # — this action does not accept or configure credentials itself. Key
    # defaults to <s3-folder>/<component>/<version>/<target-environment>.[<build-number>.]<deployment-timestamp>.deploy-manifest.json,
    # or s3-key if set. Uploads are create-only and fail if the chosen key
    # already exists. Object Lock retention is applied by the bucket's own
    # default retention rule, not by this action — "test" is not exempt.
    # required
    s3-folder: 'schemas'
    # Object key to upload to within the manifests bucket. If set, used as-is
    # instead of the s3-folder-derived default key. Must not already exist!
    # The upload will fail if it does.
    # optional (default: '')
    s3-key: 'schemas/blood-pressure-measurements/1.0.0/eu-production.146.2026-09-07T101502Z.deploy-manifest.json'

  # Outputs:
  #   manifest-json: The generated manifest, as a JSON string
  #   manifest-path: Path the manifest was written to
  #   s3-uri: The s3://bucket/key it was uploaded to
- name: Echo
  run: |
    echo "manifest-path: ${{ steps.generate-deploy-manifest.outputs.manifest-path }}"
```
<!-- end usage -->

The generated manifest can contain configuration and must not be printed to production logs. Only log its path.

- [Example](./generate-deploy-manifest/example.yml)
