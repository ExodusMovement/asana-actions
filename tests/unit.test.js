const createUtils = require('../utils')
describe('Unit tests', () => {
  const utils = createUtils()
  it('Should get new PR body for one task', () => {
    const body = '## Summary\nThis PR blah blah\ncloses: https://asana.com/foo'
    const commentPrefix = 'closes: '
    const tasks = [
      {
        permalink_url: 'https://asana.com/foo',
      },
    ]

    const newBody = utils.getNewPRBody(body, tasks, commentPrefix)
    expect(newBody).toBe(
      `## Summary\nThis PR blah blah\n${commentPrefix}[this Asana task](${tasks[0].permalink_url}).`,
    )
  })

  it('Should get new PR body for multiple tasks', () => {
    const body =
      '## Summary\nThis PR blah blah\ncloses: https://asana.com/foo https://asana.com/bar'
    const commentPrefix = 'closes: '
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
      `## Summary\nThis PR blah blah\n${commentPrefix}[this Asana task](${tasks[0].permalink_url}) & [this Asana task](${tasks[1].permalink_url}).`,
    )
  })

  it('Should get new PR body for multiple tasks in nested body', () => {
    const body =
      '## Summary\nThis PR blah blah\ncloses: https://asana.com/foo https://asana.com/bar\n\n## Further Comments\nSomething great here!'
    const commentPrefix = 'closes: '
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
      `## Summary\nThis PR blah blah\n${commentPrefix}[this Asana task](${tasks[0].permalink_url}) & [this Asana task](${tasks[1].permalink_url}).\n\n## Further Comments\nSomething great here!`,
    )
  })
})
