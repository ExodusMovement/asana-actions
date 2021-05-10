# asana-actions

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
    - name: Add to Asana
      uses: exodus/asana-actions@v1.0.0
      with:
        asana-token: ${{ secrets.ASANA_TOKEN }}
```