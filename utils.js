const core = require('@actions/core')
const github = require('@actions/github')
const { fetchival } = require('@exodus/fetch')
const xmlescape = require('xml-escape')

const COMMENT_PAGE_SIZE = 25
const PULL_REQUEST_PREFIX = 'Linked GitHub PR:'
const PIN_PULL_REQUEST_COMMENTS = true

const fetch = (token) => {
  return fetchival('https://app.asana.com/api/1.0', {
    headers: {
      Authorization: 'Bearer ' + token,
      "content-type": "application/json"
    }
  })
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function shortIdList(shortids) {
  return shortids.slice(1).split(',')
}

function stripTaskIds(task) {
  return task.gid
}

module.exports.updatePRBody = async function (workspace, github_token, tasks, pr, commentPrefix, isIssue) {
  if (!tasks || !tasks.length) return
  const multiTasks = tasks.length > 1
  const linkBody = tasks.reduce((links, task, idx) => {
    if (idx === 0) {
      links = `This PR is linked to${multiTasks ? ' these Asana tasks: ' : ''}`
    }
    links = `${links} ${multiTasks && idx === tasks.length - 1 ? ' & ' : ''}`
    links = `${links} [${multiTasks ? idx + 1 + '' : 'this Asana task'}.](https://app.asana.com/0/${workspace}/${task.gid})`
    return links
  }, '')
  const newBody = pr.body += '\n\n' + commentPrefix + linkBody
  const request = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    body: newBody
  }
  if (isIssue) request.issue_number = pr.number
  else request.pull_number = pr.number
  const octokit = github.getOctokit(github_token)
  if (isIssue) return octokit.issues.update(request)
  else return octokit.pulls.update(request)
}

module.exports.getComments = async function (token, taskId, offset) {
  // prepare pagination
  const pagination = offset ? `&offset=${offset}` : ''
  const url = `tasks/${taskId}/stories?limit=${COMMENT_PAGE_SIZE}${pagination}`
  let res = await fetch(token)(url).get()
  if (res) return res
  else return []
}

module.exports.hasPRComments = async function (token, taskId) {
  let offset
  while (true) {
    const rowsData = await module.exports.getComments(token, taskId, offset)
    const rows = rowsData.data
    if (!rows || !rows.length) {
      break
    }
    for (const row of rows) {
      if (row && row.text && row.text.indexOf(PULL_REQUEST_PREFIX) !== -1) return true
    }
    if (!rowsData.next_page) return false
    offset = rowsData.next_page.offset
    await timeout(1000)
  }
  return false
}

module.exports.addAsanaComment = async function (token, tasks, comment) {
  if (!tasks || !tasks.length) return
  const data = {
    'data': {
      'is_pinned': PIN_PULL_REQUEST_COMMENTS,
      'html_text': '<body>' + comment + '</body>'
    }
  }
  try {
    await Promise.all([...tasks].map(task => {
      fetch(token)(`tasks/${task.gid}/stories`).post(data)
    }))
    core.info(`commented on task(s) (${tasks.map(stripTaskIds)})`)
  } catch (exc) {
    core.error(`Error while commenting on task(s) (${tasks.map(stripTaskIds)})`)
  }
}

module.exports.completeAsanaTasks = async function (token, tasks) {
  if (!tasks || !tasks.length) return
  try {
    await Promise.all([...tasks].map(task => {
      fetch(token)(`tasks/${task.gid}`).put({
        'data': {
          'completed': true
        }
      })
    }))
    core.info(`completed task(s) (${tasks.map(stripTaskIds)})`)
  } catch (exc) {
    core.error(`Error while completing task(s) (${tasks.map(stripTaskIds)})`)
  }
}

module.exports.moveAsanaTasksToSection = async function (token, tasks, sectionId) {
  if (!tasks || !tasks.length) return
  try {
    await Promise.all([...tasks].map(task => {
      fetch(token)(`sections/${sectionId}/addTask`).post({
        'data': {
          'task': task.gid
        }
      })
    }))
    core.info(`posted task(s) (${tasks.map(stripTaskIds)}) to sections/${sectionId}/addTask`)
  } catch (exc) {
    core.error(`Error while posting task(s) (${tasks.map(stripTaskIds)}) to sections/${sectionId}/addTask`)
  }
}

module.exports.searchByDate = async function (token, gid, before, after) {
  const url = 'workspaces/' + gid + '/tasks/search' +
    '?opt_fields=gid,name' +
    '&modified_at.before=' + before.toISOString() +
    '&modified_at.after=' + after.toISOString() +
    '&limit=100' +
    '&sort_by=modified_at'
  core.info('fetching ' + url)
  let res = await fetch(token)(url).get()
  if (res && res.data) return res.data
  else return []
}

module.exports.getMatchingAsanaTasks = async function (token, gid, ids) {
  let d1 = new Date()
  let d2 = new Date(d1)
  let lookedAt = 0
  let callsMade = 0
  let hoursInc = 3
  const taskRows = []
  if (!ids || ids.length < 1) {
    return
  }
  while (lookedAt < 10000 && callsMade < 100) {
    d2.setHours(d2.getHours() - hoursInc)
    const rows = await module.exports.searchByDate(token, gid, d1, d2)
    callsMade++
    lookedAt += rows.length
    for (let i = 0; i < rows.length; i++) {
      for (let ii = 0; ii < ids.length; ii++) {
        if (rows[i].gid.toString().endsWith(ids[ii])) {
          taskRows.push(rows[i])
          if (taskRows.length === ids.length) {
            return taskRows
          }
        }
      }
    }
    d1.setHours(d1.getHours() - hoursInc)
    await timeout(1000)
  }
  return null
}

module.exports.addGithubPrToAsanaTask = async function (token, tasks, title, url) {
  if (!tasks || !tasks.length) return
  const tasksToComment = []
  for (const task of tasks) {
    const checkCommentInTask = await module.exports.hasPRComments(token, task.gid)
    if (!checkCommentInTask) tasksToComment.push(task)
  }
  if (!tasksToComment.length) return
  const comment = '<strong>' + PULL_REQUEST_PREFIX + '</strong> ' + xmlescape(title) + '\n<a href="' + url + '"/>'
  await module.exports.addAsanaComment(token, tasks, comment)
}

module.exports.getAsanaShortIds = function getAsanaShortIds(str) {
  if (!str) return null
  const match = /!([0-9]{4,10})+(?:,[0-9]{4,10})*/.exec(str)
  if (match) return shortIdList(match[0])
}

// module.exports.addAsanaTaskToGithubPr = async function (githubData, asanaData, replacementGithubator) {
//   var url = 'https://app.asana.com/0/0/' + asanaData.gid
//   var comment = '<strong>Linked Asana:</strong> ' + xmlescape(asanaData.name) + '\n<a href="' + url + '">' + url + '</a>'
//   await addComment(githubData.apiUrl, comment)
// }