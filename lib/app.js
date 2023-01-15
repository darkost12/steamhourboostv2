"use strict"

const SteamAccount = require("./steamaccount")

const manageDB = require("./database")

const database = manageDB.read()

const initNext = async (credentials) => {
  const { name, password, games, beOnline } = credentials
  const account = new SteamAccount(name, password, games, beOnline)

  await account.login()

  return await new Promise((resolve, _) => {
    account.boost()

    resolve(0)

    return inProgressPromise.finally(() => account.logoff())
  })
}

database.reduce(async (previous, credentials) => {
  await previous

  return await initNext(credentials)
}, Promise.resolve(0))
