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