# FibriCheck General Actions V1

A collection of general use actions

## parse-tag
<!-- start usage -->
```yaml
- name: Parse Tag
  id: parse-tag
  uses: fibricheck/actions-general/parse-tag@v1
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

## s3-increment

<!-- start usage -->
```yaml
- name: S3 Increment
  id: s3-increment
  uses: fibricheck/actions-general/s3-increment@v1
  with:
    # The S3 object file path. For example, s3://example.fibricheck.com/example/example.json
    # required
    s3-file-path: ''
    # The JQ key selector. For example, .buildNumbers.eu-app
    # required
    key-selector: ''
    # The S3 access key id
    # required
    access-key-id: ''
    # The S3 secret access key
    # required
    secret-access-key: ''
    # The S3 region
    # optional
    # default: eu-central-1
    region: ''

  # The s3-increment action has 2 outputs: old-number and new-number.
- name: Echo
  run: |
    echo "old number: ${{ steps.s3-increment.outputs.old-number }}"
    echo "new number: ${{ steps.s3-increment.outputs.new-number }}"
```
<!-- end usage -->

- [Example](./s3-increment/example.yml)

## s3-set

<!-- start usage -->
```yaml
- name: S3 Set
  id: s3-set
  uses: fibricheck/actions-general/s3-set@v1
  with:
    # The S3 object file path. For example, s3://example.fibricheck.com/example/example.json
    # required
    s3-file-path: ''
    # The JQ key selector. For example, .buildNumbers.eu-app
    # required
    key-selector: ''
    # The S3 access key id
    # required
    access-key-id: ''
    # The S3 secret access key
    # required
    secret-access-key: ''
    # The S3 region
    # required (default: eu-central-1)
    region: ''
    # The literal value to set (use this OR string, not both)
    # optional
    value: ''
    # The string value to set (use this OR value, not both)
    # optional
    string: ''
```
<!-- end usage -->

- [Example](./s3-set/example.yml)

## regex-match

<!-- start usage -->
```yaml
- name: Regex Match
  id: regex-match
  uses: fibricheck/actions-general/regex-match@v1
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
  uses: fibricheck/actions-general/xcode-cloud@v1
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
  uses: fibricheck/actions-general/sdk-version-parse@v1
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
  uses: fibricheck/actions-general/sdk-release@v1
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