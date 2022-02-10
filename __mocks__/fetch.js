const fixture = require('../tests/fixtures/asana.json')
const projectsFixture = require('../tests/fixtures/asana-projects.json')

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

const getProject = (url) => {
  const projectId = /[0-9]+/.exec(url)[0]
  return projectsFixture.find((p) => p.projectId === projectId)
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
  expect(data.completed).toEqual(task.completed)
}

const getProjectSections = (url) => {
  const project = getProject(url)
  return {
    data: project.sections,
  }
}

const postSections = (url, { data }) => {
  const task = fixture.find((t) => t.gid === data.task)
  const sectionId = /[0-9]+/.exec(url)[0]
  expect(task.newSection).toEqual(sectionId)
}

const fetch = () => (url) => ({
  get: async () => {
    switch (true) {
      case /stories/.test(url):
        return getTaskComments(url)
      case /tasks/.test(url):
        return getTasks(url)
      case /projects/.test(url):
        return getProjectSections(url)
      default:
        throw new Error(`unknown url ${url}`)
    }
  },
  post: async (data) => {
    switch (true) {
      case /tasks/.test(url):
        return postTasks(url, data)
      case /sections/.test(url):
        return postSections(url, data)
      default:
        throw new Error(`unknown url ${url}`)
    }
  },
  put: async (data) => putTask(url, data),
})

module.exports = fetch
