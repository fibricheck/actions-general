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

`generate-build-manifest`, `generate-deploy-manifest`, `download-manifests`, `latest-version` and `latest-deploy-manifests` access the shared FibriCheck manifests store. They authenticate themselves: each one assumes `arn:aws:iam::964503429135:role/github-manifests` through GitHub OIDC. The calling job only needs the `id-token: write` permission:

```yaml
permissions:
  contents: read
  id-token: write

steps:
  - name: Generate build manifest
    uses: fibricheck/actions-general/generate-build-manifest@v5
    with:
      # ...
```

The role's credentials are only used inside the action. They are never written to the job environment, so AWS credentials configured elsewhere in the job are left as they are.

The OIDC token identifies the calling repository, not `actions-general`, so the role's trust policy must allow the calling repositories.

`role-arn` overrides the role. Set it to `''` to skip authentication and use the AWS credentials already configured in the job.

`download-manifests`, `latest-version` and `latest-deploy-manifests` validate their inputs before authenticating. `generate-build-manifest` and `generate-deploy-manifest` authenticate first, because their validation checks that the component manifests exist.
## generate-build-manifest

Builds a traceability manifest JSON for a release, writes it locally, and stores it in the shared FibriCheck manifests store. It does not commit or push to Git.

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
    # Repository the build came from, owner/name. Required when commit-sha is
    # given
    # optional (default: '')
    repo: ${{ github.repository }}
    # Commit sha the build was produced from. Required unless
    # component-manifests is given
    # optional (default: '')
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
    ci-reference: ${{ github.run_id }}
    # Comma-separated list of references to the build outputs: names of local
    # files, or Docker image references on ECR
    # optional (default: '')
    build-output-references: ''
    # Comma-separated list of existing component build manifests this
    # manifest combines, as manifest references (the manifest-ref output of
    # the action that created them). Each one must be a build manifest and
    # must exist; the action fails before uploading anything if one does not.
    # optional (default: '')
    component-manifests: ''
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
    # Top-level folder within the manifests store: app, pages, schemas,
    # tasks, packages, test, or composites. composites is required when
    # component-manifests is given, and not allowed otherwise. Required — every manifest is stored, there
    # is no local-only mode. The manifest is stored as
    # <folder>/<component>/<version>[-<build-number>]/[<target-environment>.]build-manifest.json.
    # Storing is create-only and fails if the manifest already exists. Retention is applied by the store's own
    # default retention rule, not by this action — "test" is not exempt.
    # required
    folder: 'schemas'
    # Files that belong to the build (e.g. archives, test results), one path
    # per line, relative to the working directory. A directory uploads all
    # files in it. Each file is uploaded next to the manifest, keeping its
    # relative path. Files are uploaded before the manifest, so a manifest
    # only exists once all of its files are there. Uploads are create-only
    # with a SHA256 checksum; a file that already exists with the same
    # checksum (a re-run after a partial upload) is accepted, one with a
    # different checksum fails the upload (see force-upload). Empty
    # directories and files named [*.]build-manifest.json or
    # [*.]deploy-manifest.json are rejected. Download them again with
    # download-manifests.
    # optional (default: '')
    files: |
      code.zip
      test-results
    # 'true' uploads the files even when they already exist, as a new object
    # version. The manifest itself stays create-only.
    # optional (default: 'false')
    force-upload: 'false'
    # IAM role assumed through GitHub OIDC to access the manifests store. The
    # calling job needs the id-token: write permission. Set to '' to skip
    # authentication and use the AWS credentials already configured in the job.
    # optional (default: arn:aws:iam::964503429135:role/github-manifests)
    role-arn: 'arn:aws:iam::964503429135:role/github-manifests'

  # Outputs:
  #   manifest-json: The generated manifest, as a JSON string
  #   manifest-path: Path the manifest was written to
  #   manifest-ref: Reference to the stored manifest
  #   file-refs: References to the stored files, one per line
- name: Echo
  run: |
    echo "manifest-path: ${{ steps.generate-build-manifest.outputs.manifest-path }}"
```
<!-- end usage -->

The generated manifest can contain runtime-visible configuration and must not be printed to production logs. Pass it between steps through `manifest-path` or `manifest-json`; only log the path.

- [Example](./generate-build-manifest/example.yml)

## download-manifests

Downloads everything stored under `<folder>/<component>/<version>/`: its manifests and the files uploaded with them (see `files` of `generate-build-manifest`). Files uploaded with a SHA256 checksum are verified against it.

<!-- start usage -->
```yaml
- name: Download Manifests
  id: download-manifests
  uses: fibricheck/actions-general/download-manifests@v5
  with:
    # Name of the component or schema
    # required
    component: 'delete-user'
    # Version (e.g. semver)
    # required
    version: '1.1.7'
    # Top-level folder within the manifests store: app, pages, schemas,
    # tasks, packages, test, or composites
    # required
    folder: 'tasks'
    # Local directory to download into
    # optional (default: manifests/download/<component>/<version>)
    path: ''
    # Fail when nothing is stored for this version. When 'false', the found
    # output is 'false' instead
    # optional (default: 'true')
    fail-if-missing: 'true'
    # IAM role assumed through GitHub OIDC to access the manifests store. The
    # calling job needs the id-token: write permission. Set to '' to skip
    # authentication and use the AWS credentials already configured in the job.
    # optional (default: arn:aws:iam::964503429135:role/github-manifests)
    role-arn: 'arn:aws:iam::964503429135:role/github-manifests'

  # Outputs:
  #   found: 'true' when anything was stored for this version and downloaded
  #   path: Local directory everything was downloaded into
  #   files: Local paths of the downloaded files, one per line
- name: Echo
  run: |
    echo "path: ${{ steps.download-manifests.outputs.path }}"
```
<!-- end usage -->

- [Example](./download-manifests/example.yml)

## latest-version

Finds the highest version of a component that has a build manifest, and all build manifests of that version: the highest `<version>[-<build-number>]` folder under `<folder>/<component>/` holding a `build-manifest.json` or `<target-environment>.build-manifest.json`. With `version` set, it returns the build manifests of that version instead. Only `<major>.<minor>.<patch>[-<build-number>]` folders are considered, compared number by number: `1.10.0` is higher than `1.9.0`, `2.16.0-146` is higher than `2.16.0-9`, and `2.16.0` is lower than `2.16.0-1`. Other folder names (e.g. `v1.0.0`, `1.2.0-rc.1`) are never the highest version, but their build manifests are still returned when `version` names them.

<!-- start usage -->
```yaml
- name: Latest Version
  id: latest-version
  uses: fibricheck/actions-general/latest-version@v5
  with:
    # Name of the component or schema
    # required
    component: 'delete-user'
    # Top-level folder within the manifests store: app, pages, schemas,
    # tasks, packages, test, or composites
    # required
    folder: 'tasks'
    # Version folder, <version>[-<build-number>], to return the build
    # manifests of instead of the highest one
    # optional
    version: ''
    # Fail when no build manifest is found. When 'false', the found
    # output is 'false' instead
    # optional (default: 'true')
    fail-if-missing: 'true'
    # IAM role assumed through GitHub OIDC to access the manifests store. The
    # calling job needs the id-token: write permission. Set to '' to skip
    # authentication and use the AWS credentials already configured in the job.
    # optional (default: arn:aws:iam::964503429135:role/github-manifests)
    role-arn: 'arn:aws:iam::964503429135:role/github-manifests'

  # Outputs:
  #   found: 'true' when a build manifest was found
  #   version: Highest version folder, <version>[-<build-number>], or the given version
  #   build-manifest-refs: Comma-separated references to all build manifests of that version
- name: Echo
  run: |
    echo "version: ${{ steps.latest-version.outputs.version }}"
```
<!-- end usage -->

- [Example](./latest-version/example.yml)

## latest-deploy-manifests

Finds the latest deployment of each given build to `target-environment`. Each build manifest in `build-manifest-refs` is read for its component, version and build number. The deploy manifests of that build are the `<target-environment>.<deployment-timestamp>.deploy-manifest.json` files in `<folder>/<component>/<version>[-<build-number>]/`, and the one with the highest deployment timestamp is returned. Build manifests of the same component version and build number share one deploy manifest, which is returned once. Fails when a build has no deployment to `target-environment`. Typically used to assemble the `component-manifests` of a composite `generate-deploy-manifest` from the `componentManifests` of a composite build manifest.

<!-- start usage -->
```yaml
- name: Latest Deploy Manifests
  id: latest-deploy-manifests
  uses: fibricheck/actions-general/latest-deploy-manifests@v5
  with:
    # Comma-separated build manifest references (manifest-ref of
    # generate-build-manifest, build-manifest-refs of latest-version)
    # required
    build-manifest-refs: 'tasks/delete-user/1.1.7/build-manifest.json'
    # Environment the deployments went to
    # required
    target-environment: 'eu-production'
    # IAM role assumed through GitHub OIDC to access the manifests store. The
    # calling job needs the id-token: write permission. Set to '' to skip
    # authentication and use the AWS credentials already configured in the job.
    # optional (default: arn:aws:iam::964503429135:role/github-manifests)
    role-arn: 'arn:aws:iam::964503429135:role/github-manifests'

  # Outputs:
  #   deploy-manifest-refs: Comma-separated references to the latest deploy
  #     manifest of each component version and build number, in the order of
  #     build-manifest-refs
- name: Echo
  run: |
    echo "deploy manifests: ${{ steps.latest-deploy-manifests.outputs.deploy-manifest-refs }}"
```
<!-- end usage -->

- [Example](./latest-deploy-manifests/example.yml)

## generate-deploy-manifest

Builds a deployment traceability manifest JSON, writes it locally, and stores it in the shared FibriCheck manifests store. It does not commit or push to Git. Only call this after a deploy has actually succeeded — the manifest's existence is itself the success signal, there is no separate outcome field.

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
    # Reference to the build manifest for this version: the manifest-ref
    # output of generate-build-manifest. Recorded as-is; not read, fetched,
    # or validated, since the build
    # manifest is expected to already be an immutable, trustworthy record on
    # its own.
    # required
    build-manifest-ref: 'schemas/blood-pressure-measurements/1.0.0-146/eu-production.build-manifest.json'
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
    # Comma-separated list of existing component deploy manifests this
    # manifest combines, as manifest references (the manifest-ref output of
    # the action that created them). Each one must be a deploy manifest and
    # must exist; the action fails before uploading anything if one does not.
    # folder must be composites when this is given.
    # optional (default: '')
    component-manifests: ''
    # Top-level folder within the manifests store: app, pages, schemas,
    # tasks, packages, test, or composites. composites is required when
    # component-manifests is given, and not allowed otherwise. Required — every manifest is stored, there
    # is no local-only mode. The manifest is stored as
    # <folder>/<component>/<version>[-<build-number>]/<target-environment>.<deployment-timestamp>.deploy-manifest.json.
    # Storing is create-only and fails if the manifest already exists. Retention is applied by the store's own
    # default retention rule, not by this action — "test" is not exempt.
    # required
    folder: 'schemas'
    # IAM role assumed through GitHub OIDC to access the manifests store. The
    # calling job needs the id-token: write permission. Set to '' to skip
    # authentication and use the AWS credentials already configured in the job.
    # optional (default: arn:aws:iam::964503429135:role/github-manifests)
    role-arn: 'arn:aws:iam::964503429135:role/github-manifests'

  # Outputs:
  #   manifest-json: The generated manifest, as a JSON string
  #   manifest-path: Path the manifest was written to
  #   manifest-ref: Reference to the stored manifest
- name: Echo
  run: |
    echo "manifest-path: ${{ steps.generate-deploy-manifest.outputs.manifest-path }}"
```
<!-- end usage -->

The generated manifest can contain configuration and must not be printed to production logs. Only log its path.

- [Example](./generate-deploy-manifest/example.yml)
