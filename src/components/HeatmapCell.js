import React, { Component } from 'react'
import Annotation from 'libe-components/lib/text-levels/Annotation'

export default class HeatmapCell extends Component {
  constructor () {
    super()
    this.c = 'game-of-thrones__heatmap-cell'
  }
  render () {
    const { props, c } = this
    const { value } = props
    const isEmpty = typeof value !== 'number'
    const classes = [c]
    if (isEmpty) classes.push('game-of-thrones__heatmap-cell_empty')
    const style = isEmpty ? {} : { backgroundColor: `rgba(33, 33, 33, ${(value / 100)})` }
    return <td className={classes.join(' ')} style={style}>
      <div className={`${c}__tooltip`}>
        <Annotation>{Math.round(value * 10) / 10}%</Annotation>
      </div>
    </td>
  }
}
