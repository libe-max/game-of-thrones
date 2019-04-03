import React from 'react'
import ReactDOM from 'react-dom'
import GoT from './GoT'
import * as serviceWorker from './serviceWorker'
import config from './config.json'
import 'whatwg-fetch'

ReactDOM.render(
  <GoT {...config} />,
  document.getElementById('libe-labo-app-wrapper')
)

serviceWorker.unregister()
