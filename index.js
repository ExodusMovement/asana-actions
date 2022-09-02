const core = require('@actions/core')
const github = require('@actions/github')
const asanaActionsWorkflow = require('./src/asana-actions-workflow')

const run = async () => {
  try {
    await asanaActionsWorkflow(core, github)
  } catch (err) {
    core.error(err.message)
  }
}

run()
