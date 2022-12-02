import { BigNumber } from 'ethers';

export enum SideEnum {
  Long = "Long",
  Short = "Short",
}

export enum OrderTypeEnum {
  Increase = "Increase",
  Decrease = "Decrease",
  Close = "Close",
}

export type OrderType = OrderTypeEnum.Increase | OrderTypeEnum.Decrease | OrderTypeEnum.Close;

export type Side = SideEnum.Long | SideEnum.Short;

//   {
//     "collateralToken": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
//     "indexToken": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
//     "isLong": false,
//     "size": "1010998011968151529984326720000000000",
//     "collateral": "919089101789228663623014105952000000",
//     "averageEntryPrice": "1273427000000000000000000000000000",
//     "entryFundingRate": "29796",
//     "liquidationPrice": "2418353639090909090910223147825492",
//     "price": "1275867000000000000000000000000000"
// }

// Old
// export type Position = {
//   entryTime: string;
//   entryDate: string;
//   entryPrice: number;
//   exitTime?: string;
//   exitDate?: string;
//   exitPrice?: number;
//   side: string;
//   leverage: number;
//   asset: string;
//   notionalUsd: number;
//   collateralUsd: number;
//   pnl: number;
// }

export interface Position {
  side: string;
  size: BigNumber;
  collateral: BigNumber;
  asset: string;
  liquidationPrice: BigNumber;
  leverage: string;
  assetIcon?: string;
  averageEntryPrice: BigNumber;
  currentPrice: BigNumber;
}
export interface SizeOrCollateralOrLiquidationPriceOrAverageEntryPriceOrCurrentPrice {
  type: string;
  hex: string;
}


export type OpenOrder = {
  triggerPrice: number;
  type: string;
  side: string;
  leverage: number;
  asset: string;
  notionalUsd: number;
  collateralUsd: number;
}

export type OtherStat = {
  totalVolume: number;
  winRate: number;
  numTrades: number;
  totalFees: number;
  averageLeverage: number;
}

export enum PortfolioPeriodEnum {
  Day = "1D",
  Week = "7D",
  Month = "1M",
}

export type PortfolioPeriod = PortfolioPeriodEnum.Day | PortfolioPeriodEnum.Week | PortfolioPeriodEnum.Month;
