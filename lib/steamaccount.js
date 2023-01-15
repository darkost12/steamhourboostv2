"use strict"

const _ = require("lodash")
const SteamUser = require("steam-user")
const Promise = require("bluebird")
const moment = require("moment")
const EventEmitter = require("events")
const inquirer = require("inquirer")
const fs = require('fs-extra')

module.exports = class SteamAccount extends EventEmitter {
  constructor(name, password, games, beOnline) {
    super()
    this.name = name
    this.password = password
    this.games = games
    this.beOnline = beOnline
    const options = {
      promptSteamGuardCode: false,
      dataDirectory: null
    }
    let loginKey =
      fs.readFileSync(
        `session/loginKey-${this.name}`,
        { encoding: 'utf8', flag: 'a+' }
      )
    this.loginKey = loginKey ? loginKey : null
    this.client = new SteamUser(null, options)

    this.client.on("error", err => this.emit("clientError", err))
    this.client.on("steamGuard", async (_, callback) => {
      const { code } =
        await inquirer
          .prompt([{ name: "code", message: `Guard code for ${this.name}:` }])
      callback(code)
    })
    this.client.on("loginKey", key =>
      fs.writeFileSync(`session/loginKey-${this.name}`, key)
    )
  }

  logheader() {
    return _.padEnd(
      `[${moment().format("YYYY-MM-DD HH:mm:ss")} - ${this.name}]`,
      this.indent
    )
  }

  error(err) {
    return this.emit("customError", err)
  }

  login() {
    if (this.client.loggedOn) return Promise.resolve()

    return new Promise((resolve, reject) => {
      this.once("clientError", reject)
      this.once("clientSteamGuard", () => reject("Steam guard requested!"))
      this.client.once("loggedOn", resolve)

      if (this.loginKey === null) {
        return this.client.logOn({
          accountName: this.name,
          password: this.password,
          twoFactorCode: this.code,
          rememberPassword: true
        })
      } else {
        return this.client.logOn({
          accountName: this.name,
          loginKey: this.loginKey
        })
      }
    })
      .timeout(30000)
      .catch(Promise.TimeoutError, () => Promise.reject("Timed out at login"))
      .finally(() => {
        this.removeAllListeners("clientError")
        this.removeAllListeners("clientSteamGuard")
        return this.client.removeAllListeners("loggedOn")
      })
  }

  logoff() {
    return this.client.logOff()
  }

  boost() {
    const doJob = () => {
      this.client.setPersona(
        this.beOnline ?
          SteamUser.EPersonaState.Online :
          SteamUser.EPersonaState.Offline
      )
      this.client.gamesPlayed(this.games !== null ? this.games : [10, 730])
    }

    const doLog = () =>
      console.log(`${this.logheader()} Still boosting`)

    return new Promise((_, reject) => {
      console.log(`${this.logheader()} Boosting games!`)
      doJob()

      const loggerInterval = setInterval(doLog, 1800000)

      const loggedOnListener = this.client.on('loggedOn', doJob)
      this.client.once("error", e => {
        console.log(e)
        this.client.gamesPlayed([])
        clearInterval(loggerInterval)
        this.client.removeListener('loggedOn', loggedOnListener)
        reject(e)
      })
    })
  }
}
