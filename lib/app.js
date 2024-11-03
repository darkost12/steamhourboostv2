'use strict'

const SteamAccount = require('./steamaccount')

const manageDB = require('./database')

const database = manageDB.read()

const { setQueue, getQueue } = require('./loginQueue')

let loginInterval = null

const setUpLoginQueue = () => {
  loginInterval = setInterval(() => {
    let queue = getQueue()

    if (queue.length > 0) {
      queue[0].login()
    }
  }, 5000)
}

const initNext = (credentials, steamladderApiKey) => {
  const { name, password, games, beOnline, refreshSteamladder } = credentials
  const account = new SteamAccount(
    name,
    password,
    games,
    beOnline,
    refreshSteamladder ? steamladderApiKey : null
  )

  setQueue(current => [...current, account])
  return
}

const { users, steamladderApiKey } = database

users.reduce(async (previous, credentials, i) => {
  await previous

  initNext(credentials, steamladderApiKey)

  return
}, Promise.resolve(0))

setUpLoginQueue()


