const core = require('@actions/core')
const github = require('@actions/github')
const createAsanaActionsWorkflow = require('./asana-actions-workflow')

const run = async () => {
  const asanaActionsWorkflow = createAsanaActionsWorkflow(core, github)
  try {
    await asanaActionsWorkflow()
  } catch (err) {
    core.error(err.message)
  }
}

run()
