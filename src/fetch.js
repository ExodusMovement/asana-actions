const { fetchival } = require('@exodus/fetch')

const fetch = (token) => {
  return fetchival('https://app.asana.com/api/1.0', {
    headers: {
      Authorization: 'Bearer ' + token,
      'content-type': 'application/json',
    },
  })
}

module.exports = fetch
