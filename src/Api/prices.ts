import { useMemo } from "react";
import { gql } from "@apollo/client";
import useSWR from "swr";
import { ethers } from "ethers";

import { USD_DECIMALS, CHART_PERIODS, formatAmount, sleep } from "../Helpers";
import { chainlinkClient } from "./common";
import { ChainId, Period, TokenSymbol, Range } from "../types/common";
import { Candle, FastPrice } from "../types/prices";

type Price = {
  time: number
  open: number,
  close: number,
  low: number
  high: number,

}
const BigNumber = ethers.BigNumber;

// Ethereum network, Chainlink Aggregator contracts
const FEED_ID_MAP = {
  BTC_USD: "0xae74faa92cb67a95ebcab07358bc222e33a34da7",
  ETH_USD: "0x37bc7498f4ff12c19678ee8fe19d713b87f6a9e6",
  BNB_USD: "0xc45ebd0f901ba6b2b8c7e70b717778f055ef5e6d",
  LINK_USD: "0xdfd03bfc3465107ce570a0397b247f546a42d0fa",
  UNI_USD: "0x68577f915131087199fe48913d8b416b3984fd38",
  FXS_USD: "0x6c363c5a33ef6aa7030fade33b3ed1fe9d9c44a5",
  CRV_USD: "0x5ea974a35c37e42dfb91004cfe2b8aab9210f772",
  BAL_USD: "0xa022ce3aea73cbeb245fcead10e3c001551c0dd4",
  SUSHI_USD: "0x7213536a36094cd8a768a5e45203ec286cba2d74",
  AVAX_USD: "0x0fc3657899693648bba4dbd2d8b33b82e875105d",
  AAVE_USD: "0xe3f0dede4b499c07e12475087ab1a084b5f93bc0",
  YFI_USD: "0x8a4d74003870064d41d4f84940550911fbfccf04",
  SPELL_USD: "0x8640b23468815902e011948f3ab173e1e83f9879",
};
const timezoneOffset = -new Date().getTimezoneOffset() * 60;

export function fillGaps(prices: Price[], periodSeconds: number) {
  if (prices.length < 2) {
    return prices;
  }

  const newPrices = [prices[0]];
  let prevTime = prices[0].time;
  for (let i = 1; i < prices.length; i++) {
    const { time, open, low } = prices[i];
    if (prevTime) {
      let j = (time - prevTime) / periodSeconds - 1;
      while (j > 0) {
        newPrices.push({
          time: time - j * periodSeconds,
          open,
          close: open,
          high: open, // * 1.0003, 
          low: open // * 0.9996,
        });
        j--;
      }
    }

    prevTime = time;
    
    if (low === 0) {
      newPrices.push({
        ...prices[i],
        low: open * 0.9996,
      });
    } else {
      newPrices.push(prices[i]);
    }
  }

  return newPrices;
}



async function getChartPricesFromStatsV1(_chainId: ChainId, symbol: TokenSymbol, period: Period, range?: Range) {
  if (["WBTC", "WETH"].includes(symbol)) {
    symbol = symbol.substr(1);
  }

  const timeDiff = CHART_PERIODS[period] * 3000;
  const from = range?.from ? range?.from - timeDiff : Math.floor(Date.now() / 1000 - timeDiff);
  const hostname = "https://swaps-stats-kltusqhvaa-uw.a.run.app";
  // const hostname = "http://localhost:3113/";
  const url = `${hostname}/api/candles/${symbol}?preferableChainId=42161&period=${period}&from=${from}&preferableSource=fast`;
  const TIMEOUT = 5000;
  const res: Response = await new Promise(async (resolve, reject) => {
    let done = false;
    setTimeout(() => {
      done = true;
      reject(new Error(`request timeout ${url}`));
    }, TIMEOUT);

    let lastEx: any;
    for (let i = 0; i < 3; i++) {
      if (done) return;
      try {
        const res = await fetch(url);
        resolve(res);
        return;
      } catch (ex) {
        await sleep(300);
        lastEx = ex;
      }
    }
    reject(lastEx);
  });

  if (!res.ok) {
    throw new Error(`request failed ${res.status} ${res.statusText}`);
  }

  let json = await res.json();
  let prices = json?.prices;
  if (!prices || prices?.length < 10) {
    throw new Error(`not enough prices data: ${prices?.length}`);
  }

  const OBSOLETE_THRESHOLD = Date.now() / 1000 - 60 * 30; // 30 min ago
  const updatedAt = json?.updatedAt || 0;
  if (updatedAt < OBSOLETE_THRESHOLD) {
    throw new Error(
      "chart data is obsolete, last price record at " +
        new Date(updatedAt * 1000).toISOString() +
        " now: " +
        new Date().toISOString()
    );
  }

  prices = prices.map(({ t, o: open, c: close, h: high, l: low }, i: number) => {
    if (i !== 0) {
      // set open to close
      // prices are sorted in timestamp ascending order
      open = prices[i-1].c;
    }
    return {
      time: t + timezoneOffset,
      open,
      close,
      high,
      low,
    };
  });

  return prices;

}

async function getChartPricesFromStats(_chainId: ChainId, symbol: TokenSymbol, period: Period, range?: Range) {
  if (["WBTC", "WETH"].includes(symbol)) {
    symbol = symbol.substr(1);
  }

  const timeDiff = CHART_PERIODS[period] * 3000;
  const from = range?.from ? range?.from - timeDiff : Math.floor(Date.now() / 1000 - timeDiff);
  const pageSize = range?.countBack ? range?.countBack : 1000;
  const hostname = "https://dev.api.mycelium.xyz";
  // const hostname = "http://localhost:3030";
  const url = `${hostname}/trs/candles?ticker=${symbol}&preferableChainId=42161&period=${period}&from=${from}&pageSize=${pageSize}&preferableSource=fast`;
  const TIMEOUT = 5000;
  const res: Response = await new Promise(async (resolve, reject) => {
    let done = false;
    setTimeout(() => {
      done = true;
      reject(new Error(`request timeout ${url}`));
    }, TIMEOUT);

    let lastEx: any;
    for (let i = 0; i < 3; i++) {
      if (done) return;
      try {
        const res = await fetch(url);
        resolve(res);
        return;
      } catch (ex) {
        await sleep(300);
        lastEx = ex;
      }
    }
    reject(lastEx);
  });

  if (!res.ok) {
    throw new Error(`request failed ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  let prices = json?.rows;
  const min = range?.countBack ? Math.min(1000, range.countBack) : 10
  if (!prices || prices?.length < min) {
    throw new Error(`not enough prices data: ${prices?.length}`);
  }

  prices = prices.sort((a: { t: number }, b: { t: number }) => a.t - b.t).map(({ t, o: open, c: close, h: high, l: low }, i: number) => {
    if (i !== 0) {
      // set open to close
      // prices are sorted in timestamp ascending order
      open = Number(prices[i-1].c);
    }
    return {
      time: Number(t) + timezoneOffset,
      open: Number(open),
      close: Number(close),
      high: Number(high),
      low: Number(low),
    };
  })

  return prices;
}

function getCandlesFromPrices(prices: FastPrice[], period: Period): Candle[] {
  const periodTime = CHART_PERIODS[period];

  if (prices.length < 2) {
    return [];
  }

  const candles: Candle[] = [];
  const first = prices[0];
  let prevTsGroup = Math.floor(first[0] / periodTime) * periodTime;
  let prevPrice = first[1];
  let o = prevPrice;
  let h = prevPrice;
  let l = prevPrice;
  let c = prevPrice;
  for (let i = 1; i < prices.length; i++) {
    const [ts, price] = prices[i];
    const tsGroup = Math.floor(ts / periodTime) * periodTime;
    if (prevTsGroup !== tsGroup) {
      candles.push({ time: prevTsGroup + timezoneOffset, open: o, high: h, low: l, close: c });
      o = c;
      h = Math.max(o, c);
      l = Math.min(o, c);
    }
    c = price;
    h = Math.max(h, price);
    l = Math.min(l, price);
    prevTsGroup = tsGroup;
  }
  return candles;
}

async function getChainlinkChartPricesFromGraph(symbol: TokenSymbol, period: Period, range?: Range): Promise<Candle[]> {
  if (["WBTC", "WETH"].includes(symbol)) {
    symbol = symbol.substr(1);
  }
  const marketName = symbol + "_USD";
  const feedId = FEED_ID_MAP[marketName];
  if (!feedId) {
    throw new Error(`undefined marketName ${marketName}`);
  }
  const PER_CHUNK = 1000;
  const CHUNKS_TOTAL = 6;
  const requests: any[] = [];
  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    const query = gql(`{
      rounds(
        first: ${PER_CHUNK},
        skip: ${i * PER_CHUNK},
        orderBy: unixTimestamp,
        orderDirection: desc,
        where: {feed: "${feedId.toLowerCase()}"}
      ) {
        unixTimestamp,
        value
      }
    }`);
    requests.push(chainlinkClient.query({ query }));
  }

  return Promise.all(requests)
    .then((chunks) => {
      let prices: FastPrice[] = [];
      const uniqTs = new Set();
      chunks.forEach((chunk) => {
        chunk.data.rounds.forEach((item: { unixTimestamp: number, value: string }) => {
          if (uniqTs.has(item.unixTimestamp)) {
            return;
          }

          uniqTs.add(item.unixTimestamp);
          prices.push([item.unixTimestamp, Number(item.value) / 1e8]);
        });
      });

      prices.sort(([timeA], [timeB]) => timeA - timeB);
      const candles = getCandlesFromPrices(prices, period);
      return candles;
    })
    .catch((err) => {
      console.error("Failed to fetch chainlink prices", err);
      return []
    });
}


export const getChartPrices = async (chainId: ChainId, symbol: TokenSymbol, period: Period, range?: Range): Promise<Candle[]> => {
  try {
    return await getChartPricesFromStats(chainId, symbol, period, range);
  } catch (ex) {
    console.warn(ex);
    console.warn("Switching to v1 stats data");
    try {
      return await getChartPricesFromStatsV1(chainId, symbol, period, range);
    } catch (ex) {
      console.warn("Switching to graph chainlink data");
      try {
        return await getChainlinkChartPricesFromGraph(symbol, period, range);
      } catch (ex2) {
        console.warn("getChainlinkChartPricesFromGraph failed");
        console.warn(ex2);
        return [];
      }
    }
  }
}

export function useChartPrices(chainId: ChainId, symbol: TokenSymbol, isStable: boolean, period: Period, currentAveragePrice: ethers.BigNumber): [Candle[], () => any]{
  const swrKey = !isStable && symbol ? ["getChartCandles", chainId, symbol, period] : null;
  let { data: prices, mutate: updatePrices } = useSWR(swrKey, {
    fetcher: async (...args) => getChartPrices(chainId, symbol, period),
    dedupingInterval: 60000,
    focusThrottleInterval: 60000 * 10,
  });

  const currentAveragePriceString = currentAveragePrice && currentAveragePrice.toString();
  const retPrices = useMemo(() => {
    if (isStable) {
      return getStablePriceData(period);
    }

    if (!prices) {
      return [];
    }

    let _prices = [...prices];
    if (currentAveragePriceString && prices.length) {
      _prices = appendCurrentAveragePrice(_prices, BigNumber.from(currentAveragePriceString), period);
    }

    return fillGaps(_prices, CHART_PERIODS[period]);
  }, [prices, isStable, currentAveragePriceString, period]);

  return [retPrices, updatePrices];
}

function appendCurrentAveragePrice(prices: Price[], currentAveragePrice: ethers.BigNumber, period: Period): Candle[] {
  const periodSeconds = CHART_PERIODS[period];
  const currentCandleTime = Math.floor(Date.now() / 1000 / periodSeconds) * periodSeconds + timezoneOffset;
  const last = prices[prices.length - 1];
  const averagePriceValue = parseFloat(formatAmount(currentAveragePrice, USD_DECIMALS, 2));
  if (currentCandleTime === last.time) {
    last.close = averagePriceValue;
    last.high = Math.max(last.high, averagePriceValue);
    last.low = Math.max(last.low, averagePriceValue);
    return prices;
  } else {
    const newCandle = {
      time: currentCandleTime,
      open: last.close,
      close: averagePriceValue,
      high: averagePriceValue,
      low: averagePriceValue,
    };
    return [...prices, newCandle];
  }
}

function getStablePriceData(period: Period): Candle[] {
  const periodSeconds = CHART_PERIODS[period];
  const now = Math.floor(Date.now() / 1000 / periodSeconds) * periodSeconds;
  let priceData: Candle[] = [];
  for (let i = 100; i > 0; i--) {
    priceData.push({
      time: now - i * periodSeconds,
      open: 1,
      close: 1,
      high: 1,
      low: 1,
    });
  }
  return priceData;
}

