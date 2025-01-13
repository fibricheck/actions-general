# FibriCheck General Actions V1

A collection of general use actions

## parse-tag
<!-- start usage -->
```yaml
- uses: fibricheck/actions-general/parse-tag@v1
  with:
    # The tag to parse. For example, refs/tags/v2.11.0/eu/dev
    # required
    tag: ''
```
<!-- end usage -->

- [Example](./parse-tag/example.yml)

## s3-increment

<!-- start usage -->
```yaml
- uses: fibricheck/actions-general/s3-increment@v1
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
```
<!-- end usage -->

- [Example](./s3-increment/example.yml)


# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
