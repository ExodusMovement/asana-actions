const xmlescape = require('xml-escape')
const fetch = require('./fetch')

const COMMENT_PAGE_SIZE = 25
const PULL_REQUEST_PREFIX = 'Linked GitHub PR:'
const PIN_PULL_REQUEST_COMMENTS = true

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stripTaskIds(task) {
  return task.gid
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

async function addAsanaComment(core, token, tasks, comment) {
  core.info(`tasks: ${tasks}, comment: ${comment}`)
  if (!tasks || !tasks.length) return
  const data = {
    data: {
      is_pinned: PIN_PULL_REQUEST_COMMENTS,
      html_text: '<body>' + comment + '</body>',
    },
  }
  core.info(`data: ${data}`)
  try {
    await Promise.all(
      [...tasks].map((task) =>
        fetch(token)(`tasks/${task.gid}/stories`).post(data),
      ),
    )
    core.info(`commented on task(s) (${tasks.map(stripTaskIds)})`)
  } catch (exc) {
    if (process.env.NODE_ENV === 'test') {
      throw exc
    }
    core.error(`Error while commenting on task(s) (${tasks.map(stripTaskIds)})`)
  }
}

async function getComments(token, taskId, offset) {
  // prepare pagination
  const pagination = offset ? `&offset=${offset}` : ''
  const url = `tasks/${taskId}/stories?limit=${COMMENT_PAGE_SIZE}${pagination}`
  let res = await fetch(token)(url).get()
  if (res) return res
  else return []
}

async function hasPRComments(token, taskId) {
  let offset
  while (true) {
    const rowsData = await getComments(token, taskId, offset)
    const rows = rowsData.data
    if (!rows || !rows.length) {
      break
    }
    for (const row of rows) {
      if (row && row.text && row.text.indexOf(PULL_REQUEST_PREFIX) !== -1)
        return true
    }
    if (!rowsData.next_page) return false
    offset = rowsData.next_page.offset
    await timeout(1000)
  }
  return false
}

function startsWithPrefix(str, prefix) {
  return str.trim().toLowerCase().startsWith(prefix.trim().toLowerCase())
}

function startsWithAnyPrefix(str, prefixes) {
  return prefixes.some((prefix) => startsWithPrefix(str, prefix))
}

const utils = (core, github, githubToken, asanaToken) => {
  const getNewPRBody = (body, tasks, commentPrefixes) => {
    const multiTasks = tasks.length > 1
    const linkBody = tasks.reduce((links, task, idx) => {
      links = `${links}[this Asana task](${task.permalink_url})`
      if (multiTasks && idx !== tasks.length - 1) {
        links += ' & '
      }
      if (idx === tasks.length - 1) {
        // Add the dot at the end of the line.
        links += '.'
      }
      return links
    }, '')
    const lines = body.split('\n')
    let newBody = ''
    while (lines.length > 0) {
      const line = lines.shift()
      const prefix = commentPrefixes.find((prefix) =>
        startsWithPrefix(line, prefix),
      )
      if (prefix) {
        newBody += capitalize(prefix) + ' ' + linkBody
      } else {
        newBody += line
      }
      if (lines.length > 0) {
        // Only add the break if it's not the last line.
        newBody += '\n'
      }
    }
    return newBody
  }

  const updatePRBody = async (tasks, pr, commentPrefixes, isIssue) => {
    if (!tasks || !tasks.length) return
    const newBody = getNewPRBody(pr.body, tasks, commentPrefixes)
    const request = {
      body: newBody,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    }
    if (isIssue) request.issue_number = pr.number
    else request.pull_number = pr.number
    const octokit = github.getOctokit(githubToken)
    if (isIssue) return octokit.issues.update(request)
    else return octokit.pulls.update(request)
  }

  const completeAsanaTasks = async (tasks) => {
    if (!tasks && tasks.length === 0) return
    try {
      await Promise.all(
        [...tasks].map((task) =>
          fetch(asanaToken)(`tasks/${task.gid}`).put({
            data: {
              completed: true,
            },
          }),
        ),
      )
      core.info(`completed task(s) (${tasks.map(stripTaskIds)})`)
    } catch (exc) {
      core.error(`Error while completing task(s) (${tasks.map(stripTaskIds)})`)
    }
  }

  const moveAsanaTasksToSection = async (tasks, projectSectionPairs) => {
    if (!tasks || !tasks.length) return
    try {
      const validSectionIds = []
      await Promise.all(
        [...tasks].map((task) =>
          projectSectionPairs.map((projectSectionIds) => {
            const [projectId, sectionId] = projectSectionIds.split('/')
            // check if task is in project
            const taskInProject = task.projects.some(
              (project) => project.gid === projectId,
            )
            if (taskInProject) {
              // if task is in project, then move to section
              validSectionIds.push(sectionId)
              fetch(asanaToken)(`sections/${sectionId}/addTask`).post({
                data: {
                  task: task.gid,
                },
              })
            }
          }),
        ),
      )
      core.info(
        `posted task(s) (${tasks.map(
          stripTaskIds,
        )}) to sections/${validSectionIds}/addTask`,
      )
    } catch (exc) {
      core.error(`Error while posting task(s) (${tasks.map(stripTaskIds)})`)
    }
  }

  const getMatchingAsanaTasks = async (ids) => {
    const responses = await Promise.all(
      ids.map(async (taskId) => fetch(asanaToken)(`tasks/${taskId}`).get()),
    )
    return responses.map(({ data }) => data)
  }

  const addGithubPrToAsanaTask = async (tasks, title, url) => {
    core.info(`tasks in addGithubPrToAsanaTask ${tasks}`)
    if (!tasks || tasks.length === 0) return
    const tasksToComment = []
    for (const task of tasks) {
      const checkCommentInTask = await hasPRComments(asanaToken, task.gid)
      if (!checkCommentInTask) tasksToComment.push(task)
    }
    core.info(`tasksToComment in addGithubPrToAsanaTask ${tasksToComment}`)
    if (!tasksToComment.length) return
    const comment =
      '<strong>' +
      PULL_REQUEST_PREFIX +
      '</strong> ' +
      xmlescape(title) +
      '\n<a href="' +
      url +
      '"/>'
    await addAsanaComment(core, asanaToken, tasks, comment)
  }

  const getAsanaShortIds = (body, commentPrefixes) => {
    if (!body) return null

    body = body.replace(/ /g, '') // raw body

    const lines = body.split('\n')
    while (lines.length > 0) {
      const line = lines.shift()
      if (startsWithAnyPrefix(line, commentPrefixes)) {
        const resp = []
        let matches
        const reg = RegExp('https://app.asana.com/[0-9]/[0-9]*/[0-9]*', 'g')
        while ((matches = reg.exec(line)) !== null) {
          resp.push(...matches[0].split('/').slice(-1))
        }
        return resp
      }
    }
    return []
  }

  return {
    getNewPRBody,
    updatePRBody,
    completeAsanaTasks,
    moveAsanaTasksToSection,
    getMatchingAsanaTasks,
    addGithubPrToAsanaTask,
    getAsanaShortIds,
  }
}

module.exports = utils
