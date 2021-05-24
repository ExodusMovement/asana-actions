# asana-actions

This GitHub Action will link Asana tasks to GitHub Pull Requests. When a PR is merged the linked Asana task will be marked as completed.

## Usage

When you open a PR put the last 4 or more digits from the task ID in the url of the task from Asana into the PR title in the format `!1234`, for example `fix: handle uncaught exception !7194`. Your PR description will be updated by this action to link to the Asana task. When you merge your PR, the Asana task will be marked as completed.

By default no action additional action will be taken when the PR is opened and the task will be closed when the PR is merged.  Use inputs
`on_open_action` and `on_merge_action` to customize this.  The keyword `CLOSE` is used to close the task, the keyword `MOVE_TO_SECTION <SectionId>` where `<SectionId>` is the gid of the section to target, will move the Asana task to a new section.

To obtain the gid of a section you can use:

```
curl 'https://app.asana.com/api/1.0/projects/<projectId>/sections' -H 'Authorization:Bearer <PERSONAL_ACCESS_TOKEN>'
```

Where `<projectId>` can be copied from the Asana URL viewing a project board, and `<PERSONAL_ACCESS_TOKEN>` can be configured in your Asana security settings.

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
      uses: ExodusMovement/asana-actions@2.1.4
      with:
        asana_token: ${{ secrets.ASANA_TOKEN }}
        workspace: ${{ secrets.ASANA_WORKSPACE_ID }}
        github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Testing changes

- Commit the changes you want to test to a branch
- Run `npm version patch` to bump the version in package.json (this will also create a commit)
- Edit `.github/workflows/pull-request.yml` to use your new version
- Push all the changes to your branch
- Create a new release on https://github.com/ExodusMovement/asana-actions/releases with the `Tag version` field set to the same semver that you just pushed
- Finally, open a PR for your branch. It should automatically run your action on that PR
