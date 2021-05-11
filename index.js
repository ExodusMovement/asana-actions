const core = require('@actions/core')
const github = require('@actions/github')
const utils = require('./utils')

const run = async () => {
  try {
    const github_token = core.getInput('github_token')
    const asana_token = core.getInput('asana_token')
    const workspace = core.getInput('workspace')
    const commentPrefix = core.getInput('comment_prefix') || 'Linked Asana: '
    const pr = github.context.payload.pull_request
    const action = github.context.payload.action

    if (!asana_token){
      throw({message: 'ASANA_TOKEN not set'})
    }

    const lookupTask = async () => {
      if (!shortId) {
        core.info('No matching asana short id in: ' + pr.title)
        return 
      } else {
        core.info('Searching for short id: ' + shortId)
      }

      const task = await utils.getMatchingAsanaTask(asana_token, workspace, shortId)
      
      if (task) core.info('Got matching task: ' + JSON.stringify(task))
      else core.error('Did not find matching task')

      return task
    }

    const shortId = utils.getAsanaShortId(pr.title)

    if (action === 'opened' || action === 'edited') {
      if (pr.body.indexOf(commentPrefix) === -1) {
        const task = await lookupTask()
        if (!task) return

        const response = await utils.updatePRBody(workspace, github_token, task, pr, commentPrefix)

        if (response.status !== 200) {
          core.error('There was an issue while trying to update the pull-request.')
        } else {
          core.info('Modified PR body with asana link')
        }
      } else {
        core.info('Skipping, already found asana link on PR')
      }
    } else if (action === 'closed' && pr.merged) {
      const task = await lookupTask()
      if (!task) return

      await utils.completeAsanaTask(asana_token, workspace, task.gid)
      core.info('Marked linked Asana task as completed')
    }
  } catch (err) {
    core.error(err.message)
  }
}

run()