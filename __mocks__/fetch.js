const fixture = require('../tests/fixtures/asana.json')

const getTaskFromURL = (url) => {
  const taskId = /[0-9]+/.exec(url)[0]
  return fixture.find((t) => t.gid === taskId)
}

const getTaskComments = (url) => {
  const task = getTaskFromURL(url)
  return {
    data: task.comments ?? [],
  }
}

const getTasks = (url) => {
  const task = getTaskFromURL(url)
  return {
    data: task,
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
      case /stories/.test(url):
        return getTaskComments(url)
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
