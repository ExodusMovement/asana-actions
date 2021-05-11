const core = require('@actions/core')
const github = require('@actions/github')
const asana = require('./asana')

const run = async () => {
  try {
    const asana_token = core.getInput('token')
    const workspace = core.getInput('workspace')
    const commentPrefix = core.getInput('commentPrefix') || 'Linked Asana: '
    const pr = github.context.payload.pull_request
    const action = github.context.payload.action

    if (!asana_token){
      throw({message: 'ASANA_TOKEN not set'})
    }

    const lookupTask = async () => {
      if (!shortId) {
        core.info('no matching asana short id in: ' + pr.title)
        return 
      } else {
        core.info('searching for short id: ' + shortId)
      }

      const task = await asana.getMatchingAsanaTask(asana_token, workspace, shortId)
      
      if (task) core.info('got matching task: ' + JSON.stringify(task))
      else core.error('did not find matching task')

      return task
    }

    const shortId = asana.getAsanaShortId(pr.title)

    if (action === 'opened' || action === 'edited') {
      if (pr.body.indexOf(commentPrefix) === -1) {
        const task = await lookupTask()
        if (!task) return
        const link = `This PR is linked to [this Asana task.](https://app.asana.com/0/${workspace}/${task.gid})`
        const newBody = pr.body += '\n\n' + commentPrefix + link

        const request = {
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: github.context.payload.pull_request.number,
          body: newBody
        }

        const client = new github.GitHub(github.token)
        const response = await client.pulls.update(request)
        if (response.status !== 200) {
          core.error('There was an issue while trying to update the pull-request.')
        }
      }
    } else if (action === 'closed' && pr.merged) {
      const task = await lookupTask()
      if (!task) return
      await asana.completeAsanaTask(asana_token, workspace, task.gid)
    }
  } catch (err) {
    core.error(err.message)
  }
}

run()