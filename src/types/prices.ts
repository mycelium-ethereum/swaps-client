export type Candle = {
  time: number,
  open: number,
  close: number,
  high: number,
  low: number,
}

export type FastPrice = [unixTimestamp: number, value: number]
