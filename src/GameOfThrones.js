import React, { Component } from 'react'
import { parseTsv } from 'libe-utils/parse-tsv'

import HeatmapCell from './components/HeatmapCell'

import Loader from 'libe-components/lib/blocks/Loader'
import LoadingError from 'libe-components/lib/blocks/LoadingError'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'
import Annotation from 'libe-components/lib/text-levels/Annotation'

import './game-of-thrones.css'

export default class GameOfthrones extends Component {
  /* * * * * * * * * * * * * * * *
   *
   * CONSTRUCTOR
   *
   * * * * * * * * * * * * * * * */
  constructor (props) {
    super(props)
    this.c = 'game-of-thrones'
    this.api = process.env.NODE_ENV === 'production'
      ? this.props.prod_api
      : this.props.dev_api
    this.state = {
      loaded: Date.now(),
      loading: true,
      candidatesReceived: false,
      resultsReceived: false,
      error: false,
      data: {
        candidates: [],
        votes: {},
        current_episode: null
      },
    }
    this.fetchCandidates()
    this.fetchResults()
    this.fetchCandidates = this.fetchCandidates.bind(this)
    this.fetchResults = this.fetchResults.bind(this)
    this.submitVote = this.submitVote.bind(this)
    this.computeCandidatesScores = this.computeCandidatesScores.bind(this)
  }

  /* * * * * * * * * * * * * * * *
   *
   * FETCH CANDIDATES
   *
   * * * * * * * * * * * * * * * */
  fetchCandidates () {
    const { spreadsheet } = this.props
    window.fetch(spreadsheet).then(rawData => {
      if (rawData.ok) return rawData.text()
      else {
        this.setState(state => ({
          loading: !state.resultsReceived,
          candidatesReceived: Date.now(),
          error: `fetchCandidates – Error ${rawData.status}: ${rawData.statusText}`
        }))
      }
    }).then(data => {
      const parsed = parseTsv({
        tsv: data,
        tabParams: {
          keysLinePos: 1
        }
      })
      this.setState(state => ({
        loading: !state.resultsReceived,
        candidatesReceived: Date.now(),
        data: {
          ...state.data,
          candidates: parsed
        }
      }))
    }).catch(err => {
      this.setState(state => ({
        loading: !state.resultsReceived,
        candidatesReceived: Date.now(),
        error: err.message
      }))
    })
  }

  /* * * * * * * * * * * * * * * *
   *
   * FETCH RESULTS
   *
   * * * * * * * * * * * * * * * */
  fetchResults () {
    window.fetch(this.api).then(rawData => {
      if (rawData.ok) return rawData.json()
      else {
        this.setState(state => ({
          loading: !state.candidatesReceived,
          resultsReceived: Date.now(),
          error: `fetchResults – Error ${rawData.status}: ${rawData.statusText}`
        }))
      }
    }).then(data => {
      this.setState(state => ({
        loading: !state.candidatesReceived,
        resultsReceived: Date.now(),
        data: {
          ...state.data,
          votes: data.data.votes,
          current_episode: data.data.current_episode
        }
      }))
    }).catch(err => {
      this.setState(state => ({
        loading: !state.candidatesReceived,
        resultsReceived: Date.now(),
        error: err.message
      }))
    })
  }

  /* * * * * * * * * * * * * * * *
   *
   * SUBMIT VOTE
   *
   * * * * * * * * * * * * * * * */
  submitVote (id) {
    const request = {
      episode: this.state.data.current_episode,
      vote_value: id
    }
    this.setState({ loading: true })
    window.fetch(`${this.api}/submit`, {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(rawData => {
      if (rawData.ok) return rawData.json()
      else {
        this.setState(state => ({
          loading: false,
          error: `submitVote – Error ${rawData.status}: ${rawData.statusText}`
        }))
      }
    }).then(data => {
      this.setState(state => ({
        loading: false,
        page: 'results',
        data: {
          ...state.data,
          votes: data.data.votes,
          current_episode: data.data.current_episode
        }
      }))
    }).catch(err => {
      this.setState(state => ({
        loading: false,
        error: err.message
      }))
    })
  }

  /* * * * * * * * * * * * * * * *
   *
   * COMPUTE CANDIDATES SCORES
   *
   * * * * * * * * * * * * * * * */
  computeCandidatesScores () {
    const { candidates, votes } = this.state.data
    const result = {}
    candidates.forEach(candidate => {
      result[candidate.id] = [
        Math.floor(Math.random() * 100),
        Math.floor(Math.random() * 100),
        Math.floor(Math.random() * 100),
        Math.floor(Math.random() * 100),
        Math.floor(Math.random() * 100)
      ]
    })
    return result
  }

  /* * * * * * * * * * * * * * * *
   *
   * RENDER
   *
   * * * * * * * * * * * * * * * */
  render () {
    const { state, c } = this
    const { data } = state
    const scores = this.computeCandidatesScores()

    const classes = [c]
    if (state.error) classes.push(`${c}_error`)
    else if (state.loading) classes.push(`${c}_loading`)
    else if (state.page === 'results') classes.push(`${c}_results`)

    return <div className={classes.join(' ')}>
      <div className={`${c}__page ${c}__loading-page`}><Loader /></div>
      <div className={`${c}__page ${c}__error-page`}><LoadingError /></div>
      <div className={`${c}__page ${c}__vote-page`}>
        <div className={`${c}__page-label ${c}__vote-page-label`}>
          <Annotation>Vote pour qui qui gagne à la fin</Annotation>
        </div>
        <div className={`${c}__candidates-block`}>{
          data.candidates.map(candidate => {
            const bgImage = candidate.photo_url
            const style = { backgroundImage: bgImage ? `url(${bgImage})` : '' }
            return <div key={candidate.id}
              style={style}
              className={`${c}__candidate`}
              onClick={e => this.submitVote(candidate.id)}>
              <Paragraph small><span>{candidate.name}</span></Paragraph>
            </div>
          })
        }</div>
      </div>
      <div className={`${c}__page ${c}__results-page`}>
        <div className={`${c}__page-label ${c}__results-page-label`}>
          <Annotation>Page label</Annotation>
        </div>
        <table className={`${c}__results-block`}>
          <tr className={`${c}__results-header`}>
            <th className={`${c}__results-header-item`}>Nom</th>
            <th className={`${c}__results-header-item`}>ep1</th>
            <th className={`${c}__results-header-item`}>ep2</th>
            <th className={`${c}__results-header-item`}>ep3</th>
            <th className={`${c}__results-header-item`}>ep4</th>
            <th className={`${c}__results-header-item`}>ep5</th>
          </tr>{
            data.candidates.map(candidate => {
              return <tr key={candidate.id} className={`${c}__candidate-result`}>
                <td className={`${c}__candidate-result-id`}>{candidate.name}</td>{
                  scores[candidate.id].map((score, i) => {
                    return <HeatmapCell key={i} value={score} />
                  })
              }</tr>
            })
          }
        </table>
      </div>
    </div>
  }
}
