const fs = require('fs')
const path = require('path')

const fixtures = fs
  .readdirSync(__dirname)
  .filter((fname) => fname !== path.basename(__filename))
  .map((fname) => require('./' + fname))

module.exports = fixtures
