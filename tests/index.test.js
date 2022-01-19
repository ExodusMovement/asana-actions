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
  const getOctokit = () => {
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

describe('Asana Actions Workflow', () => {
  it('Should do nothing if no Asana ID present in PR', async () => {
    await createAsanaActionsWorkflow(core, createGithub(1230))
  })

  it('Should link open PR with Asana task', async () => {
    await createAsanaActionsWorkflow(core, createGithub(1234))
  })

  it('Should link open PR with Asana task with Fixes prefix', async () => {
    await createAsanaActionsWorkflow(core, createGithub(1234))
  })

  it('Should complete Asana task', async () => {
    await createAsanaActionsWorkflow(core, createGithub(1235))
  })

  it('Should link edited PR with Asana task', async () => {
    await createAsanaActionsWorkflow(core, createGithub(1236))
  })

  it('Should do nothing if PR is already linked', async () => {
    await createAsanaActionsWorkflow(core, createGithub(1237))
  })
})
