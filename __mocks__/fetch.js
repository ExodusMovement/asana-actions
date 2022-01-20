const fixture = require('../tests/fixtures/asana.json')

const getWorkspaces = (url) => {
  const params = new URLSearchParams(url)
  const modifiedAtBefore = params.get('modified_at.before')
  const modifiedAtAfter = params.get('modified_at.after')

  const data = fixture.filter(
    (task) =>
      new Date(task.modifiedAt) >= new Date(modifiedAtAfter) &&
      new Date(task.modifiedAt) <= new Date(modifiedAtBefore),
  )

  return {
    data,
  }
}

const getTaskFromURL = (url) => {
  const taskId = /[0-9]+/.exec(url)[0]
  return fixture.find((t) => t.gid === taskId)
}

const getTasks = (url) => {
  const task = getTaskFromURL(url)
  return {
    data: task.comments ?? [],
  }
}

const postTasks = (url, { data }) => {
  const task = getTaskFromURL(url)
  expect(task.newComment).toEqual(
    /<body[^>]*>((.|[\n\r])*)<\/body>/.exec(data.html_text)[1],
  )
}

const putTask = (url, { data }) => {
  const task = getTaskFromURL(url)
  expect(task.completed).toEqual(data.completed)
}

const fetch = (token) => (url) => ({
  get: async () => {
    switch (true) {
      case /workspaces/.test(url):
        return getWorkspaces(url)
      case /tasks/.test(url):
        return getTasks(url)
      default:
        throw new Error(`unknown url ${url}`)
    }
  },
  post: async (data) => postTasks(url, data),
  put: async (data) => putTask(url, data),
})

module.exports = fetch
