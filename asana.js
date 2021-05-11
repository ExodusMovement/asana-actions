const { fetchival } = require('@exodus/fetch')
const xmlescape = require('xml-escape')

const fetch = fetchival('https://app.asana.com/api/1.0', {
  headers: {
    Authorization: 'Bearer ' + process.env.ASANA_ACCESS_TOKEN
  }
})

module.exports.addAsanaComment = async function (gid, comment) {
  const data = {
    'data': {
      'is_pinned': true,
      'html_text': '<body>' + comment + '</body>'
    }
  }
  const url = 'tasks/' + gid + '/stories'
  await fetch(url).post(data)
}

module.exports.searchByDate = async function (before, after) {
  const url = 'workspaces/' + process.env.ASANA_WORKSPACE_ID + '/tasks/search' +
    '?opt_fields=gid,name' +
    '&modified_at.before=' + before.toISOString() +
    '&modified_at.after=' + after.toISOString() +
    '&limit=100' +
    '&sort_by=modified_at'
  const res = await fetch(url).get()
  if (res) return res.data
  else return []
}

module.exports.getMatchingAsanaTask = async function (id) {
  var d1 = new Date()
  var d2 = new Date(d1)
  var lookedAt = 0
  var callsMade = 0
  var hoursInc = 3
  while (lookedAt < 10000 && callsMade < 100) {
    d2.setHours(d2.getHours() - hoursInc)
    let rows = await module.exports.searchByDate(d1, d2)
    callsMade++
    lookedAt += rows.length
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].gid.toString().endsWith(id)) {
        return rows[i]
      }
    }
    d1.setHours(d1.getHours() - hoursInc)
  }
  return null
}

module.exports.addGithubPrToAsanaTask = async function (title, url, gid) {
  const comment = '<strong>Linked PR:</strong> ' + xmlescape(title) + '\n<a href="' + url + '"/>'
  await module.exports.addAsanaComment(asanaData.gid, comment)
}

module.exports.getAsanaShortId = async function getAsanaShortId (str) {
  if (!str) return null
  const match = /!([0-9]{4,10})/.exec(str)
  if (match) return match[1]
}

// module.exports.addAsanaTaskToGithubPr = async function (githubData, asanaData, replacementGithubator) {
//   var url = 'https://app.asana.com/0/0/' + asanaData.gid
//   var comment = '<strong>Linked Asana:</strong> ' + xmlescape(asanaData.name) + '\n<a href="' + url + '">' + url + '</a>'
//   await addComment(githubData.apiUrl, comment)
// }