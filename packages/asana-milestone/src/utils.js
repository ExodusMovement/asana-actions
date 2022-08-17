function startsWithPrefix(str, prefix) {
  return str.trim().toLowerCase().startsWith(prefix.trim().toLowerCase())
}

function startsWithAnyPrefix(str, prefixes) {
  return prefixes.some((prefix) => startsWithPrefix(str, prefix))
}

function getLinkedTasks({ body, commentPrefixes }) {
  console.log({ body, commentPrefixes })
  if (!body) return null

  body = body.replace(/ /g, '') // raw body

  const lines = body.split('\n')
  while (lines.length > 0) {
    const line = lines.shift()
    if (startsWithAnyPrefix(line, commentPrefixes)) {
      const taskIds = []
      const tasksByprojectId = {} // Contains a list of task IDs per project ID.
      let matches
      const reg = RegExp('https://app.asana.com/[0-9]/[0-9]*/[0-9]*', 'g')
      while ((matches = reg.exec(line)) !== null) {
        const taskId = matches[0].split('/').slice(-1)[0]
        const projectId = matches[0].split('/').slice(-2)[0]
        taskIds.push(taskId)
        if (!tasksByprojectId[projectId]) {
          tasksByprojectId[projectId] = []
        }
        tasksByprojectId[projectId].push(taskId)
      }
      return [taskIds, tasksByprojectId]
    }
  }
  return [[], {}]
}

module.exports = {
  getLinkedTasks,
}
