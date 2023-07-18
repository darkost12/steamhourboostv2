**This version of program doesn't use `.ma` files and therefore doesn't need you to take preliminary steps extracting any authentication data.**
**First run only would need your steam guard code. `refreshToken` would be derived and saved in `./config/session/` directory. Further runs would use this key. So there wouldn't be any necessity of user presence to use the program.**

Install dependencies:
```bash
yarn install
```

Config is stored in `./config/config.json`. It can be edited manually (see example `config/example.json`).

You can add user with:
```bash
yarn run user
```

To start boosting:
```bash
yarn run start
```

To run this in container and provide idler with the first guard codes to start with you would need to use simple Telegram bot.
Set Telegram bot token:
```bash
yarn run set-token
```
When any of users encounters Steam guard on login the bot would be launched and would wait for code.

Some features like db migration were removed as unused.
