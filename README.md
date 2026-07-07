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
