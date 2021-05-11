const core = require('@actions/core')
const github = require('@actions/github')
const asana = require('./asana')

const run = async () => {
  try {
    const ASANA_TOKEN = core.getInput('token')
    const WORKSPACE = core.getInput('workspace')
    const PR = github.context.payload.pull_request

    if (!ASANA_TOKEN){
      throw({message: 'ASANA_TOKEN not set'})
    }
    
    const shortId = asana.getAsanaShortId(PR.title)
    if (!shortId) return core.info('no matching asana short id in: ' + PR.title)
    else core.info('searching for short id: ' + shortId)
    const task = await asana.getMatchingAsanaTask(ASANA_TOKEN, WORKSPACE, shortId)
    if (task) core.info('got matching task: ' + JSON.stringify(task))
    else core.error('did not find matching task')
  } catch (err) {
    core.error(error.message)
  }
}

run()