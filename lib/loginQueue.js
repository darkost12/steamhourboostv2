let loginQueue = []

const setQueue = (fun) => {
  loginQueue = fun(loginQueue)
}

const getQueue = () => loginQueue

module.exports = { getQueue, setQueue }
