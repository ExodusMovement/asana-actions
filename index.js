const core = require('@actions/core')
const github = require('@actions/github')
const utils = require('./utils')

const ACTION_CLOSE_PREFIX = "CLOSE"
const ACTION_MOVE_TO_SECTION_PREFIX = "MOVE_TO_SECTION"
const run = async () => {
  try {
    const github_token = core.getInput('github_token')
    const asana_token = core.getInput('asana_token')
    const workspace = core.getInput('workspace')
    const commentPrefix = core.getInput('comment_prefix') || 'Linked Asana: '
    const on_open_action = core.getInput('on_open_action')
    const on_merge_action = core.getInput('on_merge_action') || ACTION_CLOSE_PREFIX
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

    const isCloseAction = (onAction) => {
      return onAction.startsWith(ACTION_CLOSE_PREFIX)
    }

    const isMoveAction = (onAction) => {
      return onAction.startsWith(ACTION_MOVE_TO_SECTION_PREFIX)
    }

    const getSectionFromAction = (onAction) => {
      return onAction
          .substring(ACTION_MOVE_TO_SECTION_PREFIX.length, onAction.length)
          .trim()
    }

    const doAction = async (task, onAction) => {
      if (isCloseAction(onAction)) {
        await utils.completeAsanaTask(asana_token, task.gid)
        core.info('Marked linked Asana task as completed')
      }
      if (isMoveAction(onAction)) {
        const sectionId = getSectionFromAction(onAction)
        core.info('Moving Asana task to section ' + sectionId)
        await utils.moveAsanaTaskToSection(asana_token, task.gid, sectionId)
        core.info('Moved linked Asana task to section ' + sectionId)
      }
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

      if (action === 'opened' && on_open_action) {
        await doAction(task, on_open_action)
      }

    } else if (action === 'closed' && pr.merged) {
      const task = await lookupTask()
      if (!task) return


      if (on_merge_action) {
        await doAction(task, on_merge_action)
      }
    }
  } catch (err) {
    core.error(err.message)
  }
}

run()