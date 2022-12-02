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

export interface Position {
  side: string;
  size: BigNumber;
  collateral: BigNumber;
  asset: string;
  liquidationPrice: BigNumber;
  leverage: number;
  assetIcon?: string;
  averageEntryPrice: BigNumber;
  currentPrice: BigNumber;
}

export interface SizeOrCollateralOrLiquidationPriceOrAverageEntryPriceOrCurrentPrice {
  type: string;
  hex: string;
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

export interface Trade {
  id: string;
  data: Data;
}
export interface Data {
  id: string;
  action: string;
  chainId: string;
  account: string;
  timestamp: string;
  params: string;
  blockNumber: string;
  txnHash: string;
}

export enum TradeActionEnum {
  CreateDecreaseOrder = "CreateDecreaseOrder",
  CreateIncreaseOrder = "CreateIncreaseOrder",
}

export interface Order {
  collateralToken: string;
  indexToken: string;
  collateralDelta: BigNumber;
  sizeDelta: BigNumber;
  isLong: boolean;
  triggerPrice: BigNumber;
  triggerAboveThreshold: boolean;
  type: string;
  index: number;
  account: string;
}
