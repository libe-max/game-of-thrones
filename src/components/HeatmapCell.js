import React, { Component } from 'react'

export default class HeatmapCell extends Component {
  constructor () {
    super()
  }

  render () {
    const { value } = this.props
    const isEmpty = !Number.isInteger(value)
    const classes = ['game-of-thrones__heatmap-cell']
    if (isEmpty) classes.push('game-of-thrones__heatmap-cell_empty')
    const style = isEmpty ? {} : { opacity: (value / 100) }
    return <td className={classes.join(' ')} style={style} />
  }
}
