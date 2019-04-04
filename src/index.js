import React from 'react'
import ReactDOM from 'react-dom'
import GameOfThrones from './GameOfThrones'
import * as serviceWorker from './serviceWorker'
import config from './config.json'
import 'whatwg-fetch'

ReactDOM.render(
  <GameOfThrones {...config} />,
  document.getElementById('libe-labo-app-wrapper')
)

serviceWorker.unregister()
