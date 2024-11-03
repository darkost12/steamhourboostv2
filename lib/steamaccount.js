'use strict'

const _ = require('lodash')
const SteamUser = require('steam-user')
const Promise = require('bluebird')
const moment = require('moment')
const EventEmitter = require('events')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const { passGuardCode, usesTelebot } = require('./telebot')
const { setLoginQueue } = require('./loginQueue')

module.exports = class SteamAccount extends EventEmitter {
  constructor(name, password, games, beOnline, steamladderApiKey) {
    super()
    this.name = name
    this.password = password
    this.games = games
    this.beOnline = beOnline
    this.steamladderApiKey = steamladderApiKey
    this.loggingIn = false
    const options = {
      promptSteamGuardCode: false,
      dataDirectory: `${process.cwd()}/config/servers`,
      renewRefreshTokens: true
    }
    let refreshToken =
      fs.readFileSync(
        `config/session/refreshToken-${this.name}`,
        { encoding: 'utf8', flag: 'a+' }
      )
    this.refreshToken = refreshToken ? refreshToken : null
    this.client = new SteamUser(options)

    this.client.on('error', e => {
      if (e.message === 'Expired') {
        console.log(`${this.logheader()} Removing old refresh token`)

        fs.removeSync(`config/session/refreshToken-${this.name}`)
        this.login()
      } else {
        console.log(`${this.logheader()} Unexpected error: ${e.message}`)

        this.pushToLoginQueue()
      }
    })

    // this.client.on('debug', msg => console.log(msg))

    this.client.on('steamGuard', async (_, callback) => {
      if (usesTelebot()) {
        console.log('Guard code for ' + this.name)
        passGuardCode(callback)
      } else {
        const { code } =
          await inquirer
            .prompt([{ name: 'code', message: `Guard code for ${this.name}:` }])

        callback(code)
      }
    })
    this.client.on('refreshToken', key =>
      fs.writeFileSync(`config/session/refreshToken-${this.name}`, key)
    )

    this.client.on("loggedOn", () => {
      this.loggingIn = false
      setLoginQueue(current => current.filter(acc => acc.name !== this.name))
      this.boost()
    })

    this.client.on("disconnected", () => {
      console.log(`${this.logheader()} Disconnected`)

      this.pushToLoginQueue()
    })
  }

  logheader() {
    return _.padEnd(
      `[${moment().format('YYYY-MM-DD HH:mm:ss')} - ${this.name}]`,
      this.indent
    )
  }

  pushToLoginQueue() {
    console.log(`${this.logheader()} Trying to reconnect`)
    this.loggingIn = false

    setLoginQueue(current => [...current.filter(acc => acc.name !== this.name), this])
  }

  async safeLogin() {
    if (this.client.loggedOn || this.loggingIn) return Promise.resolve(true)

    console.log(`${this.logheader()} Logging in`)

    this.loggingIn = true

    return await new Promise((_resolve, _reject) => {
      if (this.refreshToken === null) {
        return this.client.logOn({
          accountName: this.name,
          password: this.password,
          twoFactorCode: this.code,
          rememberPassword: true
        })
      } else {
        return this.client.logOn({
          refreshToken: this.refreshToken
        })
      }
    })
      .catch(e => {
        console.log(`${this.logheader()} Unexpected error during login: ${e.message}`)

        this.loggingIn = false
        Promise.reject(e.message)
      })
  }

  async refreshStats(steamladderApiKey) {
    console.log(`${this.logheader()} Refreshing stats`)

    if (steamladderApiKey) {
      try {
        const id = this.client.logOnResult.client_supplied_steamid;

        await fetch(`https://steamladder.com/api/v2/profile/${id}/`, {
          method: "POST",
          headers: { Authorization: "Token " + steamladderApiKey },
        });
      } catch (err) {
        // Do nothing
      }
    }

    return
  }

  async boost() {
    console.log(`${this.logheader()} Boosting games!`)
    this.client.setPersona(
      this.beOnline ?
        SteamUser.EPersonaState.Online :
        SteamUser.EPersonaState.Offline
    )
    this.client.gamesPlayed(this.games !== null ? this.games : [10, 730])

    if (this.steamladderApiKey) {
      await this.refreshStats(this.steamladderApiKey)
    }

    return
  }
}
