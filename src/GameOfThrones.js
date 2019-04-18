import React, { Component } from 'react'
import moment from 'moment'
import { parseTsv } from 'libe-utils/parse-tsv'

import HeatmapCell from './components/HeatmapCell'

import Loader from 'libe-components/lib/blocks/Loader'
import LoadingError from 'libe-components/lib/blocks/LoadingError'
import LogoGlyph from 'libe-components/lib/blocks/LogoGlyph'
import BlockTitle from 'libe-components/lib/text-levels/BlockTitle'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'
import Annotation from 'libe-components/lib/text-levels/Annotation'
import Slug from 'libe-components/lib/text-levels/Slug'

import './game-of-thrones.css'
import legende from './legende.png'

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
      // const hasVoted = this.findCookie(`episode-${data.data.current_episode}`)
      const hasVoted = false
      this.setState(state => {
        return {
          loading: !state.candidatesReceived,
          page: hasVoted ? 'results' : 'vote',
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
      const splField = field.split('=')
      if (splField.length === 2) {
        const [key, val] = splField
        cookieObj[key.trim()] = val.trim()
      }
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
    let max = 0
    candidates.forEach(candidate => {
      if (!this.state.loading) {
        const allVotesBeforeE1 = Array.isArray(votes.before_e1) ? votes.before_e1 : []
        const allVotesAfterE1 = Array.isArray(votes.after_e1) ? votes.after_e1 : []
        const allVotesAfterE2 = Array.isArray(votes.after_e2) ? votes.after_e2 : []
        const allVotesAfterE3 = Array.isArray(votes.after_e3) ? votes.after_e3 : []
        const allVotesAfterE4 = Array.isArray(votes.after_e4) ? votes.after_e4 : []
        const allVotesAfterE5 = Array.isArray(votes.after_e5) ? votes.after_e5 : []
        const votes_be1 = allVotesBeforeE1.filter(val => val === candidate.id).length
        const total_be1 = allVotesBeforeE1.length
        const score_be1 = current_episode >= 0 ? 100 * votes_be1 / (total_be1 || 1) : null
        const votes_e1 = allVotesAfterE1.filter(val => val === candidate.id).length
        const total_e1 = allVotesAfterE1.length
        const score_e1 = current_episode >= 1 ? 100 * votes_e1 / (total_e1 || 1) : null
        const votes_e2 = allVotesAfterE2.filter(val => val === candidate.id).length
        const total_e2 = allVotesAfterE2.length
        const score_e2 = current_episode >= 2 ? 100 * votes_e2 / (total_e2 || 1) : null
        const votes_e3 = allVotesAfterE3.filter(val => val === candidate.id).length
        const total_e3 = allVotesAfterE3.length
        const score_e3 = current_episode >= 3 ? 100 * votes_e3 / (total_e3 || 1) : null
        const votes_e4 = allVotesAfterE4.filter(val => val === candidate.id).length
        const total_e4 = allVotesAfterE4.length
        const score_e4 = current_episode >= 4 ? 100 * votes_e4 / (total_e4 || 1) : null
        const votes_e5 = allVotesAfterE5.filter(val => val === candidate.id).length
        const total_e5 = allVotesAfterE5.length
        const score_e5 = current_episode >= 5 ? 100 * votes_e5 / (total_e5 || 1) : null
        result[candidate.id] = [score_be1, score_e1, score_e2, score_e3, score_e4, score_e5]
      } else {
        result[candidate.id] = [null, null, null, null, null, null]
      }
    })
    for (let candidate in result) {
      max = Math.max(max, ...result[candidate])
    }
    return {
      result,
      max
    }
  }

  /* * * * * * * * * * * * * * * *
   *
   * RENDER
   *
   * * * * * * * * * * * * * * * */
  render () {
    const { state, c } = this
    const { data } = state
    const { votes, current_episode: currentEpisode } = data
    const scores = this.computeCandidatesScores()
    console.log(scores)
    console.log(state, document.cookie)
    const nbOfVotes = [
      (currentEpisode >= 0 && votes.before_e1) ? `${votes.before_e1.length} votes` : '',
      (currentEpisode >= 1 && votes.after_e1) ? `${votes.after_e1.length} votes` : '',
      (currentEpisode >= 2 && votes.after_e2) ? `${votes.after_e2.length} votes` : '',
      (currentEpisode >= 3 && votes.after_e3) ? `${votes.after_e3.length} votes` : '',
      (currentEpisode >= 4 && votes.after_e4) ? `${votes.after_e4.length} votes` : '',
      (currentEpisode >= 5 && votes.after_e5) ? `${votes.after_e5.length} votes` : ''
    ]

    const firstEpDate = moment('15/04/2019 03:00', 'DD/MM/YYYY HH:mm')
    const now = moment(Date.now(), 'x')
    const daysToFirstEp = Math.floor((firstEpDate - now) / 1000 / 60 / 60 / 24)
    const voteLabel = data.current_episode
      ? `À l'issue de l'épisode ${data.current_episode}...`
      : `À ${daysToFirstEp} jours de l'épisode 1...`

    const classes = [c]
    if (state.error) classes.push(`${c}_error`)
    else if (state.loading) classes.push(`${c}_loading`)
    else if (state.page === 'results') classes.push(`${c}_results`)

    return <div className={classes.join(' ')}>
      <div className={`${c}__page ${c}__loading-page`}><Loader /></div>
      <div className={`${c}__page ${c}__error-page`}><LoadingError /></div>
      <div className={`${c}__page ${c}__vote-page`}>
        <div className={`${c}__page-label ${c}__vote-page-label`}>
          <Paragraph>{voteLabel}</Paragraph>
          <BlockTitle big>Qui selon vous sera assis sur le Trône de Fer à la fin de la saison ?</BlockTitle>
        </div>
        <div className={`${c}__candidates-block`}>{
          data.candidates.map(candidate => {
            const bgImage = candidate.photo_url
            const style = { backgroundImage: bgImage ? `url(${bgImage})` : '' }
            return <div key={candidate.id}
              style={style}
              className={`${c}__candidate`}
              onClick={e => this.submitVote(candidate.id)}>
              <Slug><b>{candidate.name.split(' ')[0]}</b><br/>{candidate.name.split(' ').slice(1).join(' ')}</Slug>
            </div>
          })
        }</div>
      </div>
      <div className={`${c}__page ${c}__results-page`}>
        <div className={`${c}__page-label ${c}__results-page-label`}>
          <Paragraph>Qui selon vous sera assis sur le Trône de Fer à la fin de la saison</Paragraph>
          <BlockTitle big>Les résultats</BlockTitle>
        </div>
        <img className={`${c}__results-page-legend`} src={legende} />
        <table className={`${c}__results-block`}>
          <thead>
            <tr className={`${c}__results-header`}>
              <th className={`${c}__results-header-item`}></th>
              <th className={`${c}__results-header-item`}>
                <div>
                  <BlockTitle small>S7E7</BlockTitle>
                  <Annotation>{nbOfVotes[0]}</Annotation>
                </div>
              </th>
              <th className={`${c}__results-header-item`}>
                <div>
                  <BlockTitle small>E1</BlockTitle>
                  <Annotation>{nbOfVotes[1]}</Annotation>
                </div>
              </th>
              <th className={`${c}__results-header-item`}>
                <div>
                  <BlockTitle small>E2</BlockTitle>
                  <Annotation>{nbOfVotes[2]}</Annotation>
                </div>
              </th>
              <th className={`${c}__results-header-item`}>
                <div>
                  <BlockTitle small>E3</BlockTitle>
                  <Annotation>{nbOfVotes[3]}</Annotation>
                </div>
              </th>
              <th className={`${c}__results-header-item`}>
                <div>
                  <BlockTitle small>E4</BlockTitle>
                  <Annotation>{nbOfVotes[4]}</Annotation>
                </div>
              </th>
              <th className={`${c}__results-header-item`}>
                <div>
                  <BlockTitle small>E5</BlockTitle>
                  <Annotation>{nbOfVotes[5]}</Annotation>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>{
            data.candidates.map(candidate => {
              return <tr key={candidate.id} className={`${c}__candidate-result`}>
                <td className={`${c}__candidate-result-id`}>
                  <div className={`${c}__candidate-result-id-photo`}
                    style={{ backgroundImage: `url(${candidate.photo_url})` }} />
                  <div className={`${c}__candidate-result-id-name`}>
                    <Slug small><b>{candidate.name.split(' ')[0]}</b><br/>{candidate.name.split(' ').slice(1).join(' ')}</Slug>
                  </div>
                </td>{
                  scores.result[candidate.id].map((score, i) => {
                    return <HeatmapCell key={i} value={score} max={scores.max} />
                  })
              }</tr>
            })
          }</tbody>
        </table>
      </div>
      <div className={`${c}__credits`}>
        <Annotation><LogoGlyph /> Réalisation : Clara de Alberto, Maxime Fabas</Annotation>
      </div>
    </div>
  }
}
