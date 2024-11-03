let loginQueue = []

const setLoginQueue = (fun) => {
  loginQueue = fun(loginQueue)
}

const getLoginQueue = () => loginQueue

module.exports = { getLoginQueue, setLoginQueue }
