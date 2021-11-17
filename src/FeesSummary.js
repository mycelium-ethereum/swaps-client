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
            <div className="label">GLP APR</div>
            <div>
              95% (47% ETH, 48% esGMX)
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">USDG APR</div>
            <div>
              34% BNB
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">GMX APR</div>
            <div>
              28% (8% ETH, 20% esGMX)
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">Floor Price Fund</div>
            <div>
              + $86,879.71 of ETH
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
