import {ethers} from "ethers"

export type UserRoundData = {
    address: string,
    referralCode: string,
    numberOfTrades: number,
    position: number,
    tier: number,
    tradersReferred: number,
    commissions: ethers.BigNumber,
    rebates: ethers.BigNumber,
    totalReward: ethers.BigNumber,
    totalRewardUsd: ethers.BigNumber,
    volume: ethers.BigNumber
}
