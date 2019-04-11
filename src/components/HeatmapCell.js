import React, { Component } from 'react'
import chroma from 'chroma-js'
import Annotation from 'libe-components/lib/text-levels/Annotation'

const scale = chroma.scale(['#FFFFFF', '#E91845']).mode('lab')

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
    const color = scale(value / 100)._rgb
    if (isEmpty) classes.push('game-of-thrones__heatmap-cell_empty')
    const style = isEmpty ? {} : { backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)` }
    return <td className={classes.join(' ')} style={style}>
      <div className={`${c}__tooltip`}>
        <Annotation>{Math.round(value * 10) / 10}%</Annotation>
      </div>
    </td>
  }
}
