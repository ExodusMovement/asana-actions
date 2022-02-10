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

  // Compare what data has vs what's in the fixture
  expect(data.completed).toEqual(task.completed)
  expect(task.newSection).toEqual(data.assignee_section)
}

const getProjectSections = (url) => {
  const project = getProject(url)
  return {
    status: 200,
    data: project.sections,
  }
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
  post: async (data) => postTasks(url, data),
  put: async (data) => putTask(url, data),
})

module.exports = fetch
