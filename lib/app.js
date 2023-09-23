'use strict'

const SteamAccount = require('./steamaccount')

const manageDB = require('./database')

const database = manageDB.read()

const initNext = async (credentials, steamladderApiKey) => {
  const { name, password, games, beOnline, refreshSteamladder } = credentials
  const account = new SteamAccount(name, password, games, beOnline, refreshSteamladder)

  await account.login()

  return await new Promise((resolve, _) => {
    account.doJob(steamladderApiKey)
    resolve(0)
  })
}

const { users, steamladderApiKey } = database

users.reduce(async (previous, credentials) => {
  await previous

  return await initNext(credentials, steamladderApiKey)
}, Promise.resolve(0))
