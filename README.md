**This version of program doesn't use `.ma` files and therefore doesn't need you to take preliminary steps extracting any authentication data.**
**First run only would need your steam guard code. `loginKey` would be derived and saved in `./config/session/` directory. Further runs would use this key. So there wouldn't be any necessity of user presence to use the program.**

Install dependencies:
```bash
npm install
```

User config is stored in `./config/config.json`. It can be edited manually (see example `config/example.json`). Or you can add user with:
```bash
npm run user
```

To start boosting:
```bash
npm run app
```

Some features like db migration were removed as unused.
