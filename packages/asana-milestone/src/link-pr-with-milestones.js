module.exports = async (core, github) => {
  const githubToken = core.getInput('github_token')
  const asanaToken = core.getInput('asana_token')
  // TODO: abstract to constants and reuse from asana-link.
  const commentPrefixes = ['closes:', 'fixes:']

  console.log(github)
  console.log(JSON.stringify(github))
  const isIssue = !!github.context.payload.issue
  const pr = github.context.payload.pull_request || github.context.payload.issue
  const action = github.context.payload.action

  if (!asanaToken) {
    throw new Error({ message: 'ASANA_TOKEN not set' })
  }

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

  const [taskIds, tasksByProjectId] = utils.getAsanaIds(
    pr.body,
    commentPrefixes,
  )

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

      // Get all sections for all tasks (there might be tasks from different projects).
      const sectionsByProjects = await utils.getSectionsFromProjects(
        tasksByProjectId,
      )

      // https://developers.asana.com/docs/get-sections-in-a-project
      // Get section id for Under Review and group them by project.
      const sectionIdByProjectId = sectionsByProjects.map((project) => {
        const underReviewSection = project.sections.find((section) =>
          /Under Review/i.test(section.name),
        )
        return underReviewSection
          ? {
              projectId: project.projectId,
              section: underReviewSection.gid,
            }
          : {}
      })

      if (!isDraftPR) {
        await utils.moveTaskToSection(tasksByProjectId, sectionIdByProjectId)
      }
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
