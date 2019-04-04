import React, { Component } from 'react'

export default class GameOfThrones extends Component {
  constructor () {
    super()
    this.state = {
      responses: []
    }
    this.reloadData()
    this.reloadData = this.reloadData.bind(this)
    this.submitData = this.submitData.bind(this)
  }

  get latestResponse() {
    const { responses } = this.state
    return responses.length
      ? responses[responses.length  - 1]
      : { err: 'No data' }
  }

  reloadData () {
    fetch('http://localhost:3004/api/game-of-thrones', {method: 'POST'})
      .then(r => {
        if (r.status === 200) return r.json()
        else throw new Error(`Error ${r.status}: `)
      })
      .then(res => this.setState(state => ({
        responses: [...state.responses, res],
      })))
      .catch(e => this.setState(state => ({
        responses: [...state.responses, {
          data: null,
          err: e.message
        }]
      })))
  }

  submitData () {
    fetch('http://localhost:3004/api/game-of-thrones/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        episode: parseInt(this.select.value, 10),
        vote_value: this.input.value
      })
    }).then(r => r.json())
      .then(res => this.setState(state => ({
        responses: [...state.responses, res]
      })))
      .catch(e => this.setState(state => ({
        responses: [...state.responses, {
          data: null,
          err: e.message
        }]
      })))
  }

  render () {
    const { latestResponse } = this
    return <div>
      <button onClick={this.reloadData}>Reload data</button>
      <select ref={n => this.select = n}>
        <option value={0}>Before e1</option>
        <option value={1}>After e1</option>
        <option value={2}>After e2</option>
        <option value={3}>After e3</option>
        <option value={4}>After e4</option>
        <option value={5}>After e5</option>
      </select>
      <select ref={n => this.input = n}>
        <option value={'perso-0'}>Perso 0</option>
        <option value={'perso-1'}>Perso 1</option>
        <option value={'perso-2'}>Perso 2</option>
        <option value={'perso-3'}>Perso 3</option>
        <option value={'perso-4'}>Perso 4</option>
        <option value={'perso-5'}>Perso 5</option>
        <option value={'perso-6'}>Perso 6</option>
      </select>
      <button onClick={this.submitData}>Submit</button>
      <pre style={{ color: latestResponse.err ? 'red' : 'black' }}>{
        !latestResponse.err
          ? JSON.stringify(latestResponse.data, null, 2)
          : JSON.stringify(latestResponse.err, null, 2)
      }</pre>
    </div>
  }
}