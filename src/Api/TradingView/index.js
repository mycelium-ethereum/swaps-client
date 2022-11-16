import { CHART_PERIODS, CHART_SECONDS } from "src/Helpers";
import { fillGaps, getChartPrices } from "../prices";
import { ethers } from "ethers";

// [5m, 15m, 60m (1h), 240m(4h), 1D(24h)]
export const supportedResolutions = ["1", "5", "15", "60", "240", "24H"];
export const supportedResolutionsToPeriod = {
  1: '1m',
  5: '5m',
  15: '15m',
  60: '1h',
  240: '4h',
  1440: '1d',
}

const config = {
  supported_resolutions: [...supportedResolutions],
  exchanges: [
    {
      value: "Swaps",
      name: "Swaps",
      desc: 'Swaps',
    }
  ]
};

export const dataFeed = {
    onReady: (cb) => {
      console.debug("=====onReady running");
      setTimeout(() => cb(config), 0);
    },

    searchSymbols: (_userInput, _exchange, _symbolType, onResultReadyCallback) => {
      console.log("====Search Symbols running");
      const symbols = [
        {
          symbol: 'ETH/USD',

          full_name: `${ethers.constants.AddressZero.toString()}:ETH/USD`,
          description: 'Ethereum',
          type: 'crypto',
        }
      ]
      setTimeout(() => onResultReadyCallback(symbols));
    },

    resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
      console.log("here and resolving")
      console.log("resolveSymbol:", { symbolName });
      const marketId = symbolName.split(":")[1];
      const symbolStub = {
        name: marketId,
        full_name: `Swaps:${marketId}`,
        description: marketId,
        type: "crypto",
        session: "24x7",
        exchange: "Swaps",
        timezone: "Etc/UTC",
        format: "price",
        ticker: marketId,
        listed_exchange: "",
        minmov: 1,
        minmov2: 0,
        pricescale: 100000,
        has_intraday: true,
        debug: true,
        supported_resolutions: supportedResolutions,
      };

      if (marketId.split("/")[1].match(/USD|EUR|JPY|AUD|GBP|KRW|CNY/)) {
        symbolStub.pricescale = 100;
      }
      setTimeout(function () {
        onSymbolResolvedCallback(symbolStub);
        console.debug("Resolving that symbol....", symbolStub);
      }, 0);
    },

    getBars: async (symbolInfo, resolution, periodParams, onResult, onError) => {
      console.log("getting bars")
      const symbol = symbolInfo.name.split("/")[0];
      const period = supportedResolutionsToPeriod[resolution];
      console.log("Period in", period, resolution, periodParams);
      const prices_ = await getChartPrices(42161, symbol, period, periodParams);
      console.log("prices1", prices_)
      const prices = fillGaps(prices_, CHART_PERIODS[period])
      console.log("prices", prices);
      // console.log(prices);
      // console.log("getting bars", symbolInfo, resolution, periodParams)
      // if (prices.length) {
        const bars = prices.map((el) => {
          return {
            ...el,
            time: el.time * 1000, //TradingView requires bar time in ms
          };
        })

        // if (!periodParams.firstDataRequest) {
          // onResult([], { noData: true});
        if (bars.length < periodParams.countBack) {
          onResult(bars, { noData: false });
        } else {
          onResult(bars, { noData: false });
        }
      // } 
    // else {
        // onResult([], { noData: true });
      // }
    },
    getMarks: () => {
      console.log("getting marks")
    },

    subscribeBars: (_symbolInfo, _resolution, _onRealtimeCallback, _subscribeUID, _onResetCacheNeededCallback) => {
      console.debug("=====subscribeBars runnning");
    },
    unsubscribeBars: (_subscriberUID) => {
      console.debug("=====unsubscribeBars running");
    },
  };
