import React, { useEffect } from 'react'
import UniPool from './abis/UniPool.json'
import { useWeb3React } from '@web3-react/core'
import useSWR from 'swr'
import {
  fetcher
} from './Helpers'

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
              92% (40% ETH, 52% esGMX)
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">USDG APR</div>
            <div>
              38% BNB
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">GMX APR</div>
            <div>
              27% (6% ETH, 21% esGMX)
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">Floor Price Fund</div>
            <div>
              + $91,245.63 of ETH
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
