const createUtils = require('../src/utils')
const core = require('./github-core')

const utils = createUtils()

describe('Unit tests for creating new body', () => {
  it('Should get new PR body for one task', () => {
    const body = '## Summary\nThis PR blah blah\ncloses: https://asana.com/foo'
    const commentPrefix = 'closes:'
    const tasks = [
      {
        permalink_url: 'https://asana.com/foo',
      },
    ]

    const newBody = utils.getNewPRBody(body, tasks, [commentPrefix])
    expect(newBody).toBe(
      `## Summary\nThis PR blah blah\nCloses: [this Asana task](${tasks[0].permalink_url}).`,
    )
  })

  it('Should get new PR body for multiple tasks', () => {
    const body =
      '## Summary\nThis PR blah blah\ncloses: https://asana.com/foo https://asana.com/bar'
    const commentPrefix = 'closes:'
    const tasks = [
      {
        permalink_url: 'https://asana.com/foo',
      },
      {
        permalink_url: 'https://asana.com/bar',
      },
    ]

    const newBody = utils.getNewPRBody(body, tasks, [commentPrefix])
    expect(newBody).toBe(
      `## Summary\nThis PR blah blah\nCloses: [this Asana task](${tasks[0].permalink_url}) & [this Asana task](${tasks[1].permalink_url}).`,
    )
  })

  it('Should get new PR body for multiple tasks in nested body', () => {
    const body =
      '## Summary\nThis PR blah blah\ncloses: https://asana.com/foo https://asana.com/bar\n\n## Further Comments\nSomething great here!'
    const commentPrefix = 'closes:'
    const tasks = [
      {
        permalink_url: 'https://asana.com/foo',
      },
      {
        permalink_url: 'https://asana.com/bar',
      },
    ]

    const newBody = utils.getNewPRBody(body, tasks, [commentPrefix])
    expect(newBody).toBe(
      `## Summary\nThis PR blah blah\nCloses: [this Asana task](${tasks[0].permalink_url}) & [this Asana task](${tasks[1].permalink_url}).\n\n## Further Comments\nSomething great here!`,
    )
  })
})

describe('Unit tests for getting  ids', () => {
  it('Should return empty list when body has no asana link', () => {
    const commentPrefix = 'closes:'
    const body = '## Summary\nFooo'
    const [asanaIds] = utils.getAsanaIds(body, [commentPrefix])
    expect(asanaIds).toEqual([])
  })

  it('Should return id when body has one asana link', () => {
    const commentPrefix = 'closes:'
    const body =
      '## Summary\nFooo\ncloses: https://app.asana.com/0/120000000/123456789'
    const [taskIds, projectIds] = utils.getAsanaIds(body, [commentPrefix])
    expect(taskIds).toEqual(['123456789'])
    expect(projectIds).toEqual({ 120000000: ['123456789'] })
  })

  it('Should return ids when body has multiple asana link', () => {
    const commentPrefix = 'closes:'
    const body =
      '## Summary\nFooo\ncloses: https://app.asana.com/0/120000000/123456789 https://app.asana.com/0/120000001/123456780 https://app.asana.com/0/120000001/123456781'
    const [taskIds, projectIds] = utils.getAsanaIds(body, [commentPrefix])
    expect(taskIds).toEqual(['123456789', '123456780', '123456781'])
    expect(projectIds).toEqual({
      120000000: ['123456789'],
      120000001: ['123456780', '123456781'],
    })
  })

  it('Should return ids when body has multiple asana link', () => {
    const commentPrefix = ['closes:', 'fixes:']
    let body =
      '## Summary\nFooo\ncloses: https://app.asana.com/0/120000000/123456789 https://app.asana.com/0/120000001/123456780 https://app.asana.com/0/120000002/123456781'
    const [taskIds, projectIds] = utils.getAsanaIds(body, commentPrefix)
    expect(taskIds).toEqual(['123456789', '123456780', '123456781'])
    expect(projectIds).toEqual({
      120000000: ['123456789'],
      120000001: ['123456780'],
      120000002: ['123456781'],
    })

    body =
      '## Summary\nFooo\nfixes: https://app.asana.com/0/120000000/123456789 https://app.asana.com/0/120000001/123456780 https://app.asana.com/0/120000002/123456781'
    const [newTaskIds, newProjectIds] = utils.getAsanaIds(body, commentPrefix)
    expect(newTaskIds).toEqual(['123456789', '123456780', '123456781'])
    expect(newProjectIds).toEqual({
      120000000: ['123456789'],
      120000001: ['123456780'],
      120000002: ['123456781'],
    })
  })
})

describe('Unit tests for fetching sections', () => {
  it('Should return sections for one single task', async () => {
    const tasksByProjectId = {
      120000000: ['1234'],
    }
    const sections = await utils.getSectionsFromProjects(
      tasksByProjectId,
      core,
      '',
    )
    expect(sections).toEqual([
      {
        projectId: '120000000',
        sections: [
          {
            gid: '1201760007804672',
            name: 'Blocked',
            resource_type: 'section',
          },
          {
            gid: '1201760007804675',
            name: 'Under Review',
            resource_type: 'section',
          },
        ],
      },
    ])
  })

  it('Should return sections for multiple tasks for the same project', async () => {
    const tasksByProjectId = {
      120000000: ['1234', '1235'],
    }
    const sections = await utils.getSectionsFromProjects(tasksByProjectId)
    expect(sections).toEqual([
      {
        projectId: '120000000',
        sections: [
          {
            gid: '1201760007804672',
            name: 'Blocked',
            resource_type: 'section',
          },
          {
            gid: '1201760007804675',
            name: 'Under Review',
            resource_type: 'section',
          },
        ],
      },
    ])
  })

  it('Should return sections for multiple projects', async () => {
    const tasksByProjectId = {
      120000000: ['1234', '1235'],
      120000001: ['1236', '1237'],
    }
    const sections = await utils.getSectionsFromProjects(tasksByProjectId)
    expect(sections).toEqual([
      {
        projectId: '120000000',
        sections: [
          {
            gid: '1201760007804672',
            name: 'Blocked',
            resource_type: 'section',
          },
          {
            gid: '1201760007804675',
            name: 'Under Review',
            resource_type: 'section',
          },
        ],
      },
      {
        projectId: '120000001',
        sections: [
          {
            gid: '1201760007800982',
            name: 'Blocked',
            resource_type: 'section',
          },
          {
            gid: '1201760007808721',
            name: 'Under Review',
            resource_type: 'section',
          },
        ],
      },
    ])
  })
})
