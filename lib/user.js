'use strict'

const R = require('ramda')
const inquirer = require('inquirer')

const manageDB = require('./database')

const database = manageDB.read()

const promptGames = {
  type: 'checkbox',
  name: 'games',
  message: 'Select the games to boost:',
  choices: [
    { value: 233860, name: 'Kenshi', checked: true },
    { value: 975370, name: 'Dwarf Fortress', checked: true },
    { value: 22320, name: 'The Elder Scrolls III: Morrowind', checked: true },
    { value: 335670, name: 'LISA', checked: true },
    { value: 427520, name: 'Factorio', checked: true },
    { value: 22330, name: 'The Elder Scrolls IV: Oblivion', checked: true },
    { value: 38410, name: 'Fallout 2', checked: true },
    { value: 38400, name: 'Fallout', checked: true },
    { value: 108600, name: 'Project Zomboid', checked: true },
    { value: 7670, name: 'BioShock', checked: true },
    { value: 8850, name: 'BioShock 2', checked: true },
    { value: 48700, name: 'Mount & Blade: Warband', checked: true },
    { value: 3920, name: "Sid Meier's Pirates!", checked: true },
    { value: 243120, name: 'Betrayer', checked: true },
    { value: 219150, name: 'Hotline Miami', checked: true },
    { value: 274170, name: 'Hotline Miami 2: Wrong Number', checked: true },
    { value: 4500, name: 'S.T.A.L.K.E.R.: Shadow of Chernobyl', checked: true },
    { value: 20510, name: 'S.T.A.L.K.E.R.: Clear Sky', checked: true },
    { value: 41700, name: 'S.T.A.L.K.E.R.: Call of Pripyat', checked: true },
    { value: 20900, name: 'The Witcher', checked: true },
    { value: 15100, name: "Assassin's Creed", checked: true },
    { value: 33230, name: "Assassin's Creed II", checked: true },
    { value: 1794680, name: 'Vampire Survivors', checked: true },
    { value: 251570, name: '7 Days to Die', checked: true },
    { value: 40990, name: 'Mafia', checked: true },
    { value: 50130, name: 'Mafia II (Classic)', checked: true },
    { value: 241930, name: 'Middle-earth: Shadow of Mordor', checked: true },
    { value: 12810, name: 'Overlord II', checked: true },
    { value: 72850, name: 'The Elder Scrolls V: Skyrim', checked: true },
    { value: 261550, name: 'Mount & Blade II: Bannerlord', checked: true },
    { value: 292030, name: 'The Witcher 3: Wild Hunt', checked: true },
    { value: 322330, name: "Don't Starve Together", checked: true }
  ]
}

const askUserQuestions = async () => {
  const basic =
    await inquirer
      .prompt([
        { name: 'username', message: 'Username:' },
        { name: 'password', message: 'Password:', type: 'password' },
        promptGames,
        { name: 'customStatus', message: 'Print custom status (if needed):' }
      ])

  const { beOnline } =
    await inquirer
      .prompt({
        name: 'beOnline',
        message: 'Should you be online?',
        type: 'confirm',
        default: false,
        when: basic.customStatus === ''
      })

  const { refreshSteamladder } =
    await inquirer
      .prompt({
        name: 'refreshSteamladder',
        message: 'Should be auto-refreshed on steamladder.com?',
        type: 'confirm',
        default: true
      })

  return { ...basic, beOnline: beOnline === undefined ? true : beOnline, refreshSteamladder }
}

const askGeneralQuestions = async (currentApiKey, userNeedsRefresh) => {
  if (currentApiKey || !userNeedsRefresh) {
    return null
  } else {
    const { steamladderApiKey } =
      await inquirer
        .prompt({
          name: 'steamladderApiKey',
          message: 'Steamladder.com API key:'
        })

    return steamladderApiKey
  }
}

(
  async () => {
    const {
      username,
      password,
      games,
      customStatus,
      beOnline,
      refreshSteamladder
    } = await askUserQuestions()

    const steamladderApiKey =
      await askGeneralQuestions(database.steamladderApiKey, refreshSteamladder)

    if (steamladderApiKey) {
      database.steamladderApiKey = steamladderApiKey
    }

    let index = R.findIndex(R.propEq('name', username), database.users)

    if (index === -1) {
      database.users.push({
        name: username,
        password,
        games: customStatus === '' ? games : [customStatus].concat(games),
        beOnline,
        refreshSteamladder
      })
    }

    manageDB.write(database)

    return process.exit(0)
  }
)()

