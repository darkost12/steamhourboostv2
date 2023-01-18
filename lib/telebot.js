'use strict'

const inquirer = require('inquirer')
const manageDB = require('./database')
const { Telegraf } = require('telegraf')

const database = manageDB.read()

const setToken = async () => {
  const { telegramBotToken } = await inquirer
    .prompt({
      name: 'telegramBotToken',
      message: 'Your Telegram bot token:',
    })

  database.telegramBotToken = telegramBotToken
  manageDB.write(database)

  return
}

const passGuardCode = (callback) => {
  const { telegramBotToken } = database

  const bot = new Telegraf(telegramBotToken)

  bot.on('text', async (ctx) => {
    const code = ctx.update.message.text

    console.log(code)
    callback(code)

    await ctx.reply(`Sent your message as guard code`)
    bot.stop('SIGINT')
  })

  bot.launch()
}

const usesTelebot = () => {
  const { telegramBotToken } = database

  return !!telegramBotToken
}

module.exports = { setToken, passGuardCode, usesTelebot }
