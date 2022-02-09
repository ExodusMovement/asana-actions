# asana-actions1

This GitHub Action will link Asana tasks to GitHub Pull Requests. When a PR is merged the linked Asana task will be marked as completed.

## Usage

When you open a PR put the last 4 or more digits from the task ID in the url of the task from Asana into the PR title in the format `!1234`, for example `fix: handle uncaught exception !7194`. Your PR description will be updated by this action to link to the Asana task. When you merge your PR, the Asana task will be marked as completed.

By default no action additional action will be taken when the PR is opened and the task will be closed when the PR is merged.  Use inputs
`on_open_action` and `on_merge_action` to customize this.  The keyword `CLOSE` is used to close the task, the keyword `MOVE_TO_SECTION <ProjectId>/<SectionId>` where
`<ProjectId>` is the gid of the project the section targetted is in.
`<SectionId>` is the gid of the section to target, will move the Asana task to a new section.

Multiple pairs can be added. E.g. `<ProjectId>/<SectionId> <ProjectId>/<SectionId>`

You can also merge multiple tasks by separating them with comma using the same format `!1234,3456,7890` e.g `doc: document third party integrations !7212,7213,7214`

To obtain the gid of a section you can use:

```
curl 'https://app.asana.com/api/1.0/projects/<projectId>/sections' -H 'Authorization:Bearer <PERSONAL_ACCESS_TOKEN>'
```

Where `<projectId>` can be copied from the Asana URL viewing a project board

OR by using a curl request

```
curl 'https://app.asana.com/api/1.0/workspaces/<workspaceId>/tasks/search?opt_fields=gid,name,projects&modified_at.before=<beforeDate>&modified_at.after=<afterDate>&limit=100&sort_by=modified_at' -H 'Authorization:Bearer <PERSONAL_ACCESS_TOKEN>'
```

A sample `beforeDate/afterDate` will be in the format `2021-10-01T12:35:19.074Z`

 `<PERSONAL_ACCESS_TOKEN>` can be configured in your Asana security settings.

## Setup

You will need an Asana Public Access Token and your Asana Workspace ID

Add this to your `.github/workflows/asana-link.yml`

```
name: Asana Link
on:
  issues:
    types: [ opened, closed, edited ]
  pull_request:
    types: [ opened, closed, edited ]
jobs:
  asana:
    runs-on: ubuntu-latest
    steps:
    - name: Asana Github Link
      uses: ExodusMovement/asana-actions@3.2.1
      with:
        asana_token: ${{ secrets.ASANA_TOKEN }}
        workspace: ${{ secrets.ASANA_WORKSPACE_ID }}
```
