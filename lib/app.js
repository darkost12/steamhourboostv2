'use strict'

const SteamAccount = require('./steamaccount')

const manageDB = require('./database')

const database = manageDB.read()

const initNext = async (credentials, steamladderApiKey) => {
  const { name, password, games, beOnline, refreshSteamladder } = credentials
  const account = new SteamAccount(
    name, password, games, beOnline, refreshSteamladder ? steamladderApiKey : null
  )

  const logged = await account.login()

  if (logged) {
    return Promise.resolve(true)
  } else {
    return Promise.resolve(false)
  }
}

const { users, steamladderApiKey } = database

let running = 0

users.reduce(async (previous, credentials, i) => {
  await previous

  const result = await initNext(credentials, steamladderApiKey)

  if (result) {
    running += 1
  }

  if (running === 0 && i === users.length - 1) {
    process.exit(4)
  }

  return result
}, Promise.resolve(0))
