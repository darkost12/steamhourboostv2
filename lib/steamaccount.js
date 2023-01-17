'use strict'

const _ = require('lodash')
const SteamUser = require('steam-user')
const Promise = require('bluebird')
const moment = require('moment')
const EventEmitter = require('events')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const axios = require('axios')

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
      dataDirectory: null
    }
    let loginKey =
      fs.readFileSync(
        `session/loginKey-${this.name}`,
        { encoding: 'utf8', flag: 'a+' }
      )
    this.loginKey = loginKey ? loginKey : null
    this.client = new SteamUser(null, options)

    this.client.on('error', err => this.emit('clientError', err))
    this.client.on('steamGuard', async (_, callback) => {
      const { code } =
        await inquirer
          .prompt([{ name: 'code', message: `Guard code for ${this.name}:` }])
      callback(code)
    })
    this.client.on('loginKey', key =>
      fs.writeFileSync(`session/loginKey-${this.name}`, key)
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
      this.once('clientSteamGuard', () => reject('Steam guard requested!'))
      this.client.once('loggedOn', resolve)

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
      .catch(Promise.TimeoutError, () => Promise.reject('Timed out at login'))
      .finally(() => {
        this.removeAllListeners('clientError')
        this.removeAllListeners('clientSteamGuard')
        return this.client.removeAllListeners('loggedOn')
      })
  }

  logoff() {
    return this.client.logOff()
  }

  async refreshStats(steamladderApiKey) {
    console.log(`${this.logheader()} Refreshing stats`)

    if (steamladderApiKey) {
      const id = this.client.logOnResult.client_supplied_steamid

      const { status, data } = await axios({
        method: 'post',
        url: `https://steamladder.com/api/v1/profile/${id}/`,
        headers: { Authorization: 'Token ' + steamladderApiKey },
        validateStatus: _ => true
      })

      if (data && data.error && data.error.includes('recently got updated')) {
        console.log(`${this.logheader()} Was updated recently`)
      } else if (status === 200) {
        console.log(`${this.logheader()} Successfully updated`)
      } else {
        console.log(`${this.logheader()} Request ended with code - ${response.status}`)
      }
    } else {
      console.log(`${this.logheader()} API key not provided`)
    }

    return
  }

  boost(steamladderApiKey) {
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
      let refreshInterval

      if (this.refreshSteamladder) {
        this.refreshStats(steamladderApiKey)
        refreshInterval = setInterval(() => this.refreshStats(steamladderApiKey), 14460000)
      }

      const loggedOnListener = this.client.on('loggedOn', doJob)

      this.client.once('error', e => {
        clearInterval(loggerInterval)
        refreshInterval ? clearInterval(refreshInterval) : null

        this.client.gamesPlayed([])
        this.client.removeListener('loggedOn', loggedOnListener)

        console.log(e)
        reject(e)
      })
    })
  }
}
