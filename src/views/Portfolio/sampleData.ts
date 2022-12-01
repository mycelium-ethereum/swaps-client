import { Position } from 'src/types/portfolio';

export const openPositionsDummyData: Position[] = [
  {
    entryTime: "3:20pm",
    entryDate: "03/11/2022",
    entryPrice: 933468.12,
    side: "Short",
    leverage: 5,
    asset: "ETH",
    notionalUsd: 33893,
    collateralUsd: 3983.68,
    pnl: 4590920.0,
  },
  {
    entryTime: "3:20pm",
    entryDate: "03/11/2022",
    entryPrice: 933468.12,
    side: "Long",
    leverage: 5,
    asset: "ETH",
    notionalUsd: 33893,
    collateralUsd: 3983.68,
    pnl: 4590920.0,
  },
]

export const closedPositionsDummyData: Position[] = [
  {
    entryTime: "3:20pm",
    entryDate: "03/11/2022",
    entryPrice: 933468.12,
    exitTime: "3:20pm",
    exitDate: "03/11/2022",
    exitPrice: 933468.12,
    side: "Short",
    leverage: 5,
    asset: "ETH",
    notionalUsd: 33893,
    collateralUsd: 3983.68,
    pnl: 4590920.0,
  },
  {
    entryTime: "3:20pm",
    entryDate: "03/11/2022",
    entryPrice: 933468.12,
    exitTime: "3:20pm",
    exitDate: "03/11/2022",
    exitPrice: 933468.12,
    side: "Long",
    leverage: 5,
    asset: "ETH",
    notionalUsd: 33893,
    collateralUsd: 3983.68,
    pnl: 4590920.0,
  },
]

export const openOrdersDummyData = [
  {
    triggerPrice: 933468.12,
    type: "Increase",
    side: "Short",
    leverage: 5,
    asset: "ETH",
    notionalUsd: 33893,
    collateralUsd: 3983.68,
  },
  {
    triggerPrice: 933468.12,
    type: "Decrease",
    side: "Short",
    leverage: 5,
    asset: "ETH",
    notionalUsd: 33893,
    collateralUsd: 3983.68,
  },
]

export const otherStatsDummyData = [
  {
    totalVolume: 353983.68,
    winRate: 87,
    numTrades: 12,
    totalFees: 3983.68,
    averageLeverage: 1.0654,
  }
]
