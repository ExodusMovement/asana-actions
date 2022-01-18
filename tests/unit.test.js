const createUtils = require('../utils')
describe('Unit tests', () => {
  const utils = createUtils()
  it('Should get new PR body for one task', () => {
    const body = '## Summary\nThis PR blah blah'
    const commentPrefix = 'Linked Asana: '
    const tasks = [
      {
        permalink_url: 'https://asana.com/foo',
      },
    ]

    const newBody = utils.getNewPRBody(body, tasks, commentPrefix)

    expect(newBody).toBe(
      `## Summary\nThis PR blah blah\n\n${commentPrefix}This PR is linked to  [this Asana task.](${tasks[0].permalink_url})`,
    )
  })

  it('Should get new PR body for multiple tasks', () => {
    const body = '## Summary\nThis PR blah blah'
    const commentPrefix = 'Linked Asana: '
    const tasks = [
      {
        permalink_url: 'https://asana.com/foo',
      },
      {
        permalink_url: 'https://asana.com/bar',
      },
    ]

    const newBody = utils.getNewPRBody(body, tasks, commentPrefix)

    expect(newBody).toBe(
      `## Summary\nThis PR blah blah\n\n${commentPrefix}This PR is linked to these Asana tasks:   [1.](${tasks[0].permalink_url})  &  [2.](${tasks[1].permalink_url})`,
    )
  })
})
