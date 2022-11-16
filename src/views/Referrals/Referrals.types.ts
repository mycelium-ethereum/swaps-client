import { ethers } from "ethers"

export type UserRoundData = {
    address: string,
    referralCode: string,
    numberOfTrades: number,
    position: number,
    tier: number,
    tradersReferred: number,
    commissions: ethers.BigNumber,
    commissionsVolume: ethers.BigNumber,
    rebates: ethers.BigNumber,
    rebatesVolume: ethers.BigNumber,
    totalReward: ethers.BigNumber,
    totalRewardUsd: ethers.BigNumber,
    volume: ethers.BigNumber
}
