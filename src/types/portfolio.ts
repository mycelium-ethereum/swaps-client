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

export type Position = {
  entryTime: string;
  entryDate: string;
  entryPrice: number;
  exitTime?: string;
  exitDate?: string;
  exitPrice?: number;
  side: string;
  leverage: number;
  asset: string;
  notionalUsd: number;
  collateralUsd: number;
  pnl: number;
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

export type PortfolioPeriod = PortfolioPeriodEnum["1"] | PortfolioPeriodEnum["7"] | PortfolioPeriodEnum["1"];
