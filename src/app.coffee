_             = require 'lodash'
R             = require 'ramda'
Promise       = require 'bluebird'
global.reqlib = require('app-root-path').require

SteamAccount = reqlib '/src/steamaccount.coffee'
manageDB     = reqlib '/src/database'
database     = manageDB.read()

telebotStart = reqlib '/src/telebot'
telebotStart()

if database.length is 0
  console.log 'No accounts have been added! Please run \'npm run user\' to add accounts!'
  process.exit 0

pad = 24 + _.maxBy(R.pluck('name', database), 'length').length
accounts = _.compact database.map ({name, password, sentry, secret, games=[]}) ->
  if games.length > 0
    new SteamAccount name, password, sentry, secret, games, pad
  else
    null

restartBoost = ->
  console.log '\n---- Restarting accounts ----\n'
  Promise.map accounts, _.method 'restartGames'
  .delay 1800000
  .finally restartBoost

console.log '\n---- Starting to boost ----\n'
Promise.map accounts, _.method 'boost'
.delay 1800000
.then restartBoost