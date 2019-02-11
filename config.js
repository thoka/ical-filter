const yaml = require('yaml')
const fs = require('fs')

module.exports = yaml.parse(
  fs.readFileSync('config.yml', 'utf8')
)
