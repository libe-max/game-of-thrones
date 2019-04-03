import React, { Component } from 'react'

export default class GoT extends Component {
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
      : { data: 'No data' }
  }

  reloadData () {
    fetch('http://localhost:3004/api/got')
      .then(r => r.json())
      .then(res => this.setState(state => ({
        responses: [...state.responses, res]
      })))
      .catch(e => console.log(e))
  }

  submitData () {
    fetch('http://localhost:3004/api/got/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        current_episode: parseInt(this.select.value, 10),
        vote_value: this.input.value
      })
    }).then(r => r.json())
      .then(res => this.setState(state => ({
        responses: [...state.responses, res]
      })))
      .catch(e => console.log(e))
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
        <option value={6}>After finalèèè</option>
      </select>
      <input ref={n => this.input = n} type='text' placeholder='name' />
      <button onClick={this.submitData}>Submit</button>
      <pre style={{ color: latestResponse.err ? 'red' : 'black' }}>{
        !latestResponse.err
          ? JSON.stringify(latestResponse.data, null, 2)
          : JSON.stringify(latestResponse.err, null, 2)
      }</pre>
    </div>
  }
}