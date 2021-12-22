import React from 'react'

import './FeesSummary.css'

export default function FeesSummary() {
  return(
    <div className="FeesSummary">
      <div className="App-card">
        <div className="App-card-title">Weekly Rewards Distribution</div>
        <div className="App-card-divider"></div>
        <div className="App-card-content">
          <div className="App-card-row">
            <div className="label">GMX APR</div>
            <div>
              25% (5% ETH, 20% esGMX)
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">GLP APR</div>
            <div>
              53% (23% ETH, 30% esGMX)
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">Floor Price Fund</div>
            <div>
              + $34,249.47 of ETH
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
