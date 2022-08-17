const core = require('@actions/core')
const github = require('@actions/github')
const linkPRwithMilestones = require('./link-pr-with-milestones')

const run = async () => {
  try {
    await linkPRwithMilestones(core, github)
  } catch (err) {
    core.error(err.message)
  }
}

run()
