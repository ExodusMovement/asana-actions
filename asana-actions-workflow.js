const createUtils = require('./utils')

const ACTION_CLOSE_PREFIX = 'CLOSE'
const ACTION_MOVE_TO_SECTION_PREFIX = 'MOVE_TO_SECTION'

module.exports = async (core, github) => {
  const githubToken = core.getInput('github_token')
  const asanaToken = core.getInput('asana_token')
  const onOpenAction = core.getInput('on_open_action')
  const failOnNoTask = core.getInput('fail_on_no_task')
  const onMergeAction = core.getInput('on_merge_action') || ACTION_CLOSE_PREFIX
  const commentPrefixes = ['closes:', 'fixes:']

  const isIssue = !!github.context.payload.issue
  const pr = github.context.payload.pull_request || github.context.payload.issue
  const action = github.context.payload.action

  if (!asanaToken) {
    throw { message: 'ASANA_TOKEN not set' }
  }
  const utils = createUtils(core, github, githubToken, asanaToken)

  core.info(
    `Running action for ${isIssue ? 'issue' : 'PR'} #${pr.number}: ${pr.title}`,
  )

  const lookupTasks = async (taskIds) => {
    if (!taskIds || !taskIds.length) {
      core.info('No matching asana short id in: ' + JSON.stringify(pr.body))
      if (failOnNoTask) {
        throw new Error(
          'No matching asana short id in: ' + JSON.stringify(pr.body),
        )
      }
    } else {
      core.info('Searching for short id: ' + taskIds.join(','))
    }

    const tasks = await utils.getMatchingAsanaTasks(taskIds)

    if (tasks && tasks.length > 0) {
      core.info('Got matching task: ' + JSON.stringify(tasks))
    } else {
      core.error('Did not find matching task')
      if (failOnNoTask) {
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
      await utils.completeAsanaTasks(tasks)
      core.info('Marked linked Asana task(s) as completed')
      await utils.addGithubPrToAsanaTask(tasks, pr.title, pr.html_url || pr.url)
      core.info('Post PR link to asana task on completion.')
    }
    if (isMoveAction(onAction)) {
      const projectSectionPairs = getProjectAndSectionFromAction(onAction)
      core.info('Moving Asana task(s) to section ' + projectSectionPairs)
      await utils.moveAsanaTasksToSection(tasks, projectSectionPairs)
      core.info('Moved linked Asana task(s) to section ' + projectSectionPairs)
    }
  }

  const [taskIds] = utils.getAsanaIds(pr.body, commentPrefixes)
  let tasks
  if (action === 'opened' || action === 'edited') {
    if (/\[this Asana task\]/.test(pr.body)) {
      core.info('Skipping, already found asana link on PR')
      return
    }
    tasks = await lookupTasks(taskIds)
    if (!tasks || !tasks.length) return

    const response = await utils.updatePRBody(
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
      await utils.addGithubPrToAsanaTask(tasks, pr.title, pr.html_url || pr.url)
      core.info('Modified PR body with asana link')
    }

    if (action === 'opened' && onOpenAction) {
      await doAction(tasks, onOpenAction)
    }
  } else if (action === 'closed' && (isIssue || pr.merged)) {
    tasks = await lookupTasks(taskIds)
    if (!tasks || !tasks.length) return

    if (onMergeAction) {
      await doAction(tasks, onMergeAction)
    }
  }
}
