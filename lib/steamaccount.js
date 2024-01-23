'use strict'

const _ = require('lodash')
const SteamUser = require('steam-user')
const Promise = require('bluebird')
const moment = require('moment')
const EventEmitter = require('events')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const axios = require('axios')
const { passGuardCode, usesTelebot } = require('./telebot')

module.exports = class SteamAccount extends EventEmitter {
  constructor(name, password, games, beOnline, refreshSteamladder) {
    super()
    this.name = name
    this.password = password
    this.games = games
    this.beOnline = beOnline
    this.refreshSteamladder = refreshSteamladder
    const options = {
      promptSteamGuardCode: false,
      dataDirectory: `${process.cwd()}/config/servers`
    }
    let refreshToken =
      fs.readFileSync(
        `config/session/refreshToken-${this.name}`,
        { encoding: 'utf8', flag: 'a+' }
      )
    this.refreshToken = refreshToken ? refreshToken : null
    this.client = new SteamUser(options)

    this.client.on('error', err => this.emit('clientError', err))
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
    this.client.on('loginKey', key =>
      fs.writeFileSync(`config/session/refreshToken-${this.name}`, key)
    )
  }

  logheader() {
    return _.padEnd(
      `[${moment().format('YYYY-MM-DD HH:mm:ss')} - ${this.name}]`,
      this.indent
    )
  }

  error(err) {
    return this.emit('customError', err)
  }

  login() {
    if (this.client.loggedOn) return Promise.resolve()

    return new Promise((resolve, reject) => {
      this.once('clientError', reject)
      this.client.once('loggedOn', resolve)

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
      .timeout(30000)
      .catch(Promise.TimeoutError, () => {
        this.removeAllListeners('clientError')
        this.client.removeAllListeners('loggedOn')
        Promise.reject('Timed out at login')
      })
      .finally(() => {
        this.removeAllListeners('clientError')
        this.client.removeAllListeners('loggedOn')
        return
      })
  }

  async refreshStats(steamladderApiKey) {
    console.log(`${this.logheader()} Refreshing stats`)

    if (steamladderApiKey) {
      const id = this.client.logOnResult.client_supplied_steamid

      try {
        await axios({
          method: 'post',
          url: `https://steamladder.com/api/v2/profile/${id}/`,
          timeout: 3000,
          headers: { Authorization: 'Token ' + steamladderApiKey },
          validateStatus: _ => true
        })
      } catch (err) {
        if (err.code === 'ECONNABORTED') {
          // Do nothing
        }
      }
    } else {
      console.log(`${this.logheader()} API key not provided`)
    }

    return
  }

  async doJob(steamladderApiKey) {
    while (true) {
      await this.boost(steamladderApiKey)
    }
  }

  async boost(steamladderApiKey) {
    const playGames = () => {
      this.client.setPersona(
        this.beOnline ?
          SteamUser.EPersonaState.Online :
          SteamUser.EPersonaState.Offline
      )
      this.client.gamesPlayed(this.games !== null ? this.games : [10, 730])
    }

    return new Promise((resolve, reject) => {
      console.log(`${this.logheader()} Boosting games!`)
      this.client.webLogOn()
      playGames()

      if (this.refreshSteamladder) {
        this.refreshStats(steamladderApiKey)
      }

      this.client.on('loggedOn', playGames)

      this.client.once('error', e => {
        console.log(e)

        this.client.gamesPlayed([])
        this.client.removeAllListeners('loggedOn')
        this.client.removeAllListeners('error')
        reject(e)
      })

      setTimeout(async () => {
        console.log(`${this.logheader()} Restarting`)
        this.client.gamesPlayed([])
        this.removeAllListeners('clientError')
        this.client.removeAllListeners('loggedOn')
        this.client.removeAllListeners('error')
        resolve()
      }, 1800000)
    })
  }
}
