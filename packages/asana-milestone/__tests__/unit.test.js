const utils = require('../src/utils')
const core = require('./github-core')

describe('Unit tests for getting tasks from body', () => {
  it('Should return null on no body', () => {
    const body = ''
    const commentPrefixes = ['closes:']
    expect(utils.getLinkedTasks({ body, commentPrefixes })).toBe(null)
  })

  it('Should return empty array on body with no prefix', () => {
    const body = '## Summary\n\nDepends on #1312\n\n## Screenshots\n\n'
    const commentPrefixes = ['closes:']
    expect(utils.getLinkedTasks({ body, commentPrefixes })).toEqual([[], {}])
  })

  it('Should return task id when one task linked', () => {
    const projectId = '120000000'
    const taskId = '1234'
    const dummyTaskLink = `https://app.asana.com/0/${projectId}/${taskId}`
    const body = `## Summary\n\nDepends on #1312\n\nCloses: (this Asana task)[${dummyTaskLink}].\n\n## Screenshots\n\n`
    const commentPrefixes = ['closes:']
    expect(utils.getLinkedTasks({ body, commentPrefixes })).toEqual([
      [taskId],
      { [projectId]: [taskId] },
    ])
  })

  it('Should return task ids when multiple tasks linked', () => {
    const projectId1 = '120000000'
    const projectId2 = '230000000'
    const taskId1 = '1234'
    const taskId2 = '5678'
    const dummyTaskLink1 = `https://app.asana.com/0/${projectId1}/${taskId1}`
    const dummyTaskLink2 = `https://app.asana.com/0/${projectId2}/${taskId2}`
    const body = `## Summary\n\nDepends on #1312\n\nCloses: (this Asana task)[${dummyTaskLink1}] & (this Asana task)[${dummyTaskLink2}]\n\n## Screenshots\n\n`
    const commentPrefixes = ['closes:']
    expect(utils.getLinkedTasks({ body, commentPrefixes })).toEqual([
      [taskId1, taskId2],
      { [projectId1]: [taskId1], [projectId2]: [taskId2] },
    ])
  })

  it('Should return task ids when multiple tasks linked to multiple projects', () => {
    const projectId1 = '120000000'
    const projectId2 = '230000000'
    const taskId1 = '1234'
    const taskId2 = '5678'
    const taskId3 = '9012'
    const dummyTaskLink1 = `https://app.asana.com/0/${projectId1}/${taskId1}`
    const dummyTaskLink2 = `https://app.asana.com/0/${projectId2}/${taskId2}`
    const dummyTaskLink3 = `https://app.asana.com/0/${projectId2}/${taskId3}`
    const body = `## Summary\n\nDepends on #1312\n\nCloses: (this Asana task)[${dummyTaskLink1}] & (this Asana task)[${dummyTaskLink2}] & (this Asana task)[${dummyTaskLink3}]\n\n## Screenshots\n\n`
    const commentPrefixes = ['closes:']
    expect(utils.getLinkedTasks({ body, commentPrefixes })).toEqual([
      [taskId1, taskId2, taskId3],
      { [projectId1]: [taskId1], [projectId2]: [taskId2, taskId3] },
    ])
  })
})
