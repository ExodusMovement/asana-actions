const createUtils = require('./utils')

const ACTION_CLOSE_PREFIX = 'CLOSE'
const ACTION_MOVE_TO_SECTION_PREFIX = 'MOVE_TO_SECTION'

module.exports = async (core, github) => {
  const github_token = core.getInput('github_token')
  const asana_token = core.getInput('asana_token')
  const on_open_action = core.getInput('on_open_action')
  const fail_on_no_task = core.getInput('fail_on_no_task')
  const on_merge_action =
    core.getInput('on_merge_action') || ACTION_CLOSE_PREFIX
  const commentPrefixes = ['closes:', 'fixes:']

  const utils = createUtils(core, github, asana_token)

  const isIssue = !!github.context.payload.issue
  const pr = github.context.payload.pull_request || github.context.payload.issue
  const action = github.context.payload.action

  if (!asana_token) {
    throw { message: 'ASANA_TOKEN not set' }
  }

  core.info(
    `Running action for ${isIssue ? 'issue' : 'PR'} #${pr.number}: ${pr.title}`,
  )

  const lookupTasks = async (shortidList) => {
    if (!shortidList || !shortidList.length) {
      core.info('No matching asana short id in: ' + JSON.stringify(pr.body))
      if (fail_on_no_task) {
        throw new Error(
          'No matching asana short id in: ' + JSON.stringify(pr.body),
        )
      }
    } else {
      core.info('Searching for short id: ' + shortidList.join(','))
    }

    const tasks = await utils.getMatchingAsanaTasks(asana_token, shortidList)

    if (tasks && tasks.length > 0) {
      core.info('Got matching task: ' + JSON.stringify(tasks))
    } else {
      core.error('Did not find matching task')
      if (fail_on_no_task) {
        throw { message: 'Did not find matching task' }
      }
    }

    return tasks
  }

  const isCloseAction = (onAction) => {
    return onAction.startsWith(ACTION_CLOSE_PREFIX)
  }

  const isMoveAction = (onAction) => {
    return onAction.startsWith(ACTION_MOVE_TO_SECTION_PREFIX)
  }

  const getProjectAndSectionFromAction = (onAction) => {
    return onAction
      .substring(ACTION_MOVE_TO_SECTION_PREFIX.length, onAction.length)
      .trim()
      .split(' ')
  }

  const doAction = async (tasks, onAction) => {
    if (isCloseAction(onAction)) {
      await utils.completeAsanaTasks(asana_token, tasks)
      core.info('Marked linked Asana task(s) as completed')
      await utils.addGithubPrToAsanaTask(
        asana_token,
        tasks,
        pr.title,
        pr.html_url || pr.url,
      )
      core.info('Post PR link to asana task on completion.')
    }
    if (isMoveAction(onAction)) {
      const projectSectionPairs = getProjectAndSectionFromAction(onAction)
      core.info('Moving Asana task(s) to section ' + projectSectionPairs)
      await utils.moveAsanaTasksToSection(
        asana_token,
        tasks,
        projectSectionPairs,
      )
      core.info('Moved linked Asana task(s) to section ' + projectSectionPairs)
    }
  }
  if (/\[this Asana task\]/.test(pr.body)) {
    core.info('Skipping, already found asana link on PR')
    return
  }
  const shortidList = utils.getAsanaShortIds(pr.body, commentPrefixes)
  let tasks
  if (action === 'opened' || action === 'edited') {
    tasks = await lookupTasks(shortidList)
    if (!tasks || !tasks.length) return

    const response = await utils.updatePRBody(
      github_token,
      tasks,
      pr,
      commentPrefixes,
      isIssue,
    )

    if (response.status !== 200) {
      core.error(
        'There was an issue while trying to update the pull-request/issue.',
      )
    } else {
      // only when opened and asana link not found so we can have the PR link (comment) as soon as the first PR action
      await utils.addGithubPrToAsanaTask(
        asana_token,
        tasks,
        pr.title,
        pr.html_url || pr.url,
      )
      core.info('Modified PR body with asana link')
    }

    if (action === 'opened' && on_open_action) {
      await doAction(tasks, on_open_action)
    }
  } else if (action === 'closed' && (isIssue || pr.merged)) {
    tasks = await lookupTasks(shortidList)
    if (!tasks || !tasks.length) return

    if (on_merge_action) {
      await doAction(tasks, on_merge_action)
    }
  }
}
