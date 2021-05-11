const core = require('@actions/core')
const github = require('@actions/github')
const asana = require('./asana')

const run = async () => {
  try {
    const ASANA_TOKEN = core.getInput('token')
    const WORKSPACE = core.getInput('workspace')
    const PR = github.context.payload.pull_request
    const ACTION = github.context.payload.action
    core.info('action: ' + ACTION)

    if (!ASANA_TOKEN){
      throw({message: 'ASANA_TOKEN not set'})
    }
        
    const shortId = asana.getAsanaShortId(PR.title)

    if (ACTION !== 'closed') return
    
    if (!shortId) return core.info('no matching asana short id in: ' + PR.title)
    else core.info('searching for short id: ' + shortId)
    
    const task = await asana.getMatchingAsanaTask(ASANA_TOKEN, WORKSPACE, shortId)
    
    if (task) core.info('got matching task: ' + JSON.stringify(task))
    else return core.error('did not find matching task')

    await asana.completeAsanaTask(ASANA_TOKEN, WORKSPACE, task.gid)
  } catch (err) {
    core.error(err.message)
  }
}

run()