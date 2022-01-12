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
              29% (11% ETH, 18% esGMX)
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">GLP APR (ARB)</div>
            <div>
              119% (72% ETH, 47% esGMX)
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">GLP APR (AVAX)</div>
            <div>
              132% (58% AVAX, 74% esGMX)
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">Floor Price Fund</div>
            <div>
              + $158,268.77 of ETH
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
