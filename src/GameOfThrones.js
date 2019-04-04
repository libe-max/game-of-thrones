import React, { Component } from 'react'

export default class GameOfthrones extends Component {
  /* * * * * * * * * * * * * * * *
   *
   * CONSTRUCTOR
   *
   * * * * * * * * * * * * * * * */
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      candidatesReceived: false,
      resultsReceived: false,
      error: false,
      data: {
        candidates: [],
        votes: {},
        current_episode: null
      }
    }
    this.fetchCandidates()
    this.fetchResults()
    this.fetchCandidates = this.fetchCandidates.bind(this)
    this.fetchResults = this.fetchResults.bind(this)
  }

  /* * * * * * * * * * * * * * * *
   *
   * FETCH CANDIDATES
   *
   * * * * * * * * * * * * * * * */
  fetchCandidates () {
    const { spreadsheet } = this.props
    window.fetch(spreadsheet).then(rawData => {
      if (rawData.ok) {
        return rawData.text()
      } else {
        this.setState(state => ({
          loading: state.resultsReceived,
          candidatesReceived: true,
          error: `fetchCandidates – Error ${rawData.status}: ${rawData.statusText}`
        }))
      }
    }).then(data => {
      this.setState(state => ({
        loading: state.resultsReceived,
        candidatesReceived: true,
        data: {
          ...state.data,
          candidates: data
        }
      }))
    }).catch(err => {
      this.setState(state => ({
        loading: state.resultsReceived,
        candidatesReceived: true,
        error: err.message
      }))
    })
    
    // if (rawData.ok) {
    //   const data = await rawData.text()
    //   console.log(data)
    //   return
    // } else {
    //   console.log('EEERRRORRRHHRRR')
    //   return
    // }


    // this.setState(state => ({
    //   loading: state.resultsReceived,
    //   candidatesReceived: true,
    //   data: {
    //     ...state.data,

    //   }
    // }))
  }

  /* * * * * * * * * * * * * * * *
   *
   * FETCH RESULTS
   *
   * * * * * * * * * * * * * * * */
  fetchResults () {

  }

  render () {
    console.log(this.state)
    return <div>Lol</div>
  }
}
