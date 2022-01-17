jest.setTimeout(30000)
const createAsanaActionsWorkflow = require('../asana-actions-workflow')
const coreFixture = require('./fixtures/core.json')
const githubFixture = require('./fixtures/github')
const core = {
  getInput: (value) => coreFixture[value],
  info: (p) => {
    console.log(p)
  },
  error: () => {},
}
const getPR = (number) =>
  githubFixture.find((gh) => gh.context.payload.pull_request.number === number)

const createGithub = (number) => {
  const github = getPR(number)
  const getOctokit = (access_token) => {
    return {
      pulls: {
        update: (newBody) => {
          expect(newBody).toEqual(github.newBody)
          return {
            status: 200,
          }
        },
      },
    }
  }
  return {
    getOctokit,
    ...github,
  }
}

test('Asana Actions Workflow', async () => {
  // it('Pull request with one asana link in body', async () => {
  await createAsanaActionsWorkflow(core, createGithub(100))
  expect(true).toBe(true)
  // })
})
