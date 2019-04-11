import React, { Component } from 'react'
import { parseTsv } from 'libe-utils/parse-tsv'

import HeatmapCell from './components/HeatmapCell'

import Loader from 'libe-components/lib/blocks/Loader'
import LoadingError from 'libe-components/lib/blocks/LoadingError'
import BlockTitle from 'libe-components/lib/text-levels/BlockTitle'
import Annotation from 'libe-components/lib/text-levels/Annotation'
import Slug from 'libe-components/lib/text-levels/Slug'

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
      canVote: true,
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
    this.findCookie = this.findCookie.bind(this)
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
      else throw new Error(`fetchCandidates – Error ${rawData.status}: ${rawData.statusText}`)
    }).then(data => {
      if (data.err) throw new Error(data.err)
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
      console.warn(err)
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
      else throw new Error(`fetchResults – Error ${rawData.status}: ${rawData.statusText}`)
    }).then(data => {
      if (data.err) throw new Error(data.err)
      const hasVoted = this.findCookie(`episode-${data.data.current_episode}`)
      this.setState(state => {
        return {
          loading: !state.candidatesReceived,
          // page: hasVoted ? 'results' : 'vote',
          resultsReceived: Date.now(),
          data: {
            ...state.data,
            votes: data.data.votes,
            current_episode: data.data.current_episode
          }
        }
      })
    }).catch(err => {
      console.warn(err)
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
    const { current_episode: currentEpisode } = this.state.data
    const request = {
      episode: currentEpisode,
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
      else throw new Error(`submitVote – Error ${rawData.status}: ${rawData.statusText}`)
    }).then(data => {
      if (data.err) throw new Error(data.err)
      document.cookie = `episode-${currentEpisode}=1`
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
      console.warn(err)
      this.setState(state => ({
        loading: false,
        error: err.message
      }))
    })
  }

  /* * * * * * * * * * * * * * * *
   *
   * FIND COOKIE
   *
   * * * * * * * * * * * * * * * */
  findCookie (name) {
    const decoded = window.decodeURIComponent(document.cookie)
    const fields = decoded.split(';')
    const cookieObj = {}
    fields.forEach(field => {
      const [key, val] = field.split('=')
      cookieObj[key.trim()] = val.trim()
    })
    return cookieObj[name]
  }

  /* * * * * * * * * * * * * * * *
   *
   * COMPUTE CANDIDATES SCORES
   *
   * * * * * * * * * * * * * * * */
  computeCandidatesScores () {
    const { candidates, votes, current_episode } = this.state.data
    const result = {}
    candidates.forEach(candidate => {
      if (!this.state.loading) {
        const votes_be1 = votes.before_e1.filter(val => val === candidate.id).length
        const total_be1 = votes.before_e1.length
        const score_be1 = current_episode >= 0 ? 100 * votes_be1 / (total_be1 || 1) : null
        const votes_e1 = votes.after_e1.filter(val => val === candidate.id).length
        const total_e1 = votes.after_e1.length
        const score_e1 = current_episode >= 1 ? 100 * votes_e1 / (total_e1 || 1) : null
        const votes_e2 = votes.after_e2.filter(val => val === candidate.id).length
        const total_e2 = votes.after_e2.length
        const score_e2 = current_episode >= 2 ? 100 * votes_e2 / (total_e2 || 1) : null
        const votes_e3 = votes.after_e3.filter(val => val === candidate.id).length
        const total_e3 = votes.after_e3.length
        const score_e3 = current_episode >= 3 ? 100 * votes_e3 / (total_e3 || 1) : null
        const votes_e4 = votes.after_e4.filter(val => val === candidate.id).length
        const total_e4 = votes.after_e4.length
        const score_e4 = current_episode >= 4 ? 100 * votes_e4 / (total_e4 || 1) : null
        const votes_e5 = votes.after_e5.filter(val => val === candidate.id).length
        const total_e5 = votes.after_e5.length
        const score_e5 = current_episode >= 5 ? 100 * votes_e5 / (total_e5 || 1) : null
        result[candidate.id] = [score_be1, score_e1, score_e2, score_e3, score_e4, score_e5]
      } else {
        result[candidate.id] = [null, null, null, null, null, null]
      }
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
    console.log(state, document.cookie)

    const classes = [c]
    if (state.error) classes.push(`${c}_error`)
    else if (state.loading) classes.push(`${c}_loading`)
    else if (state.page === 'results') classes.push(`${c}_results`)

    return <div className={classes.join(' ')}>
      <div className={`${c}__page ${c}__loading-page`}><Loader /></div>
      <div className={`${c}__page ${c}__error-page`}><LoadingError /></div>
      <div className={`${c}__page ${c}__vote-page`}>
        <div className={`${c}__page-label ${c}__vote-page-label`}>
          <BlockTitle>À l'issue de l'épisode {data.current_episode}, qui selon vous sera assis sur le Trône de Fer à la fin de la saison ?</BlockTitle>
        </div>
        <div className={`${c}__candidates-block`}>{
          data.candidates.map(candidate => {
            const bgImage = candidate.photo_url
            const style = { backgroundImage: bgImage ? `url(${bgImage})` : '' }
            return <div key={candidate.id}
              style={style}
              className={`${c}__candidate`}
              onClick={e => this.submitVote(candidate.id)}>
              <Slug><span>{candidate.name}</span></Slug>
            </div>
          })
        }</div>
      </div>
      <div className={`${c}__page ${c}__results-page`}>
        <div className={`${c}__page-label ${c}__results-page-label`}>
          <BlockTitle>Résultats du sondage</BlockTitle>
        </div>
        <table className={`${c}__results-block`}>
          <thead>
            <tr className={`${c}__results-header`}>
              <th className={`${c}__results-header-item`}></th>
              <th className={`${c}__results-header-item`}><Annotation small>S7E7</Annotation></th>
              <th className={`${c}__results-header-item`}><Annotation small>E1</Annotation></th>
              <th className={`${c}__results-header-item`}><Annotation small>E2</Annotation></th>
              <th className={`${c}__results-header-item`}><Annotation small>E3</Annotation></th>
              <th className={`${c}__results-header-item`}><Annotation small>E4</Annotation></th>
              <th className={`${c}__results-header-item`}><Annotation small>E5</Annotation></th>
            </tr>
          </thead>
          <tbody>{
            data.candidates.map(candidate => {
              return <tr key={candidate.id} className={`${c}__candidate-result`}>
                <td className={`${c}__candidate-result-id`}>
                  <div className={`${c}__candidate-result-id-photo`}
                    style={{ backgroundImage: `url(${candidate.photo_url})` }} />
                  <div className={`${c}__candidate-result-id-name`}>
                    <Annotation small>{candidate.name}</Annotation>
                  </div>
                </td>{
                  scores[candidate.id].map((score, i) => {
                    return <HeatmapCell key={i} value={score} />
                  })
              }</tr>
            })
          }</tbody>
        </table>
      </div>
    </div>
  }
}
