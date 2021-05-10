# asana-actions test

add this to your `.github/workflows/pull-request.yml`

```
name: Pull Request
on:
  pull_request:
    types: [ opened, edited ]
jobs:
  asana:
    runs-on: ubuntu-latest
    steps:
    - name: Asana Github Pull Request Link
      uses: ExodusMovement/asana-actions@1.0.2
      with:
        asana-token: ${{ secrets.ASANA_TOKEN }}
```
