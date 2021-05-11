# asana-actions

This GitHub Action will link Asana tasks to GitHub Pull Requests. When a PR is merged the linked Asana task will be marked as completed.

## Usage

When you open a PR put the last 4 or more digits from the task ID in the url of the task from Asana into the PR title in the format `!1234`, for example `fix: handle uncaught exception !7194`. Your PR description will be updated by this action to link to the Asana task. When you merge your PR, the Asana task will be marked as completed.

## Setup

You will need an Asana Public Access Token and your Asana Workspace ID

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
      uses: ExodusMovement/asana-actions@2.0.0
      with:
        asana_token: ${{ secrets.ASANA_TOKEN }}
        workspace: ${{ secrets.ASANA_WORKSPACE_ID }}
        github_token: ${{ secrets.GITHUB_TOKEN }}

```
