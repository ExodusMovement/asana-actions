# asana-actions

Add this to your `.github/workflows/pull-request.yml`

```
name: Pull Request
on:
  pull_request:
    types: [ opened, closed, edited ]
jobs:
  asana:
    runs-on: ubuntu-latest
    steps:
    - name: Asana Github Pull Request Link
      uses: ExodusMovement/asana-actions@1.0.21
      with:
        token: ${{ secrets.ASANA_TOKEN }}
        workspace: ${{ secrets.ASANA_WORKSPACE_ID }}
```
