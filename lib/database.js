'use strict'

const fs = require('fs-extra')
const approot = require('app-root-path')

const DB_PATH = 'config/config.json'

const write = (obj, path = DB_PATH) =>
  fs.writeJsonSync(approot.resolve(path), obj, { spaces: 2, EOL: '\n' })

const read = (path = DB_PATH) => {
  const resolvedPath = approot.resolve(path)

  if (!fs.existsSync(resolvedPath)) {
    fs.ensureFileSync(resolvedPath)
    write({ users: [] }, path)
  }

  return fs.readJsonSync(resolvedPath)
}

module.exports = { read, write }
