const supportedResolutions = [
  // these work if you set it as default but seem to fail when changing
  // '5' as ChartingLibraryWidgetOptions['interval'],
  "1D",
];

const config = {
  supported_resolutions: [...supportedResolutions],
};

export const generateDataFeed = (priceData) => {
  console.log(priceData);
  if (!priceData) {
    return null;
  }
  const dataFeed = {
    onReady: (cb) => {
      console.debug("=====onReady running");
      setTimeout(() => cb(config), 0);
    },

    searchSymbols: (_userInput, _exchange, _symbolType, _onResultReadyCallback) => {
      console.debug("====Search Symbols running");
    },

    resolveSymbol: (symbolName, onSymbolResolvedCallback, _onResolveErrorCallback) => {
      console.debug("resolveSymbol:", { symbolName });
      const marketId = symbolName.split(":")[1];
      const symbolStub = {
        name: marketId,
        full_name: symbolName,
        description: marketId,
        type: "crypto",
        session: "24x7",
        timezone: "Etc/UTC",
        format: "price",
        ticker: marketId,
        exchange: "",
        listed_exchange: "",
        minmov: 1,
        minmov2: 0,
        pricescale: 100000,
        has_intraday: true,
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

    getBars: (symbolInfo, resolution, periodParams, onResult, onError) => {
      if (priceData.length) {
        const bars = priceData.map((el) => {
          return {
            ...el,
            time: el.time * 1000, //TradingView requires bar time in ms
          };
        });
        onResult(bars, { noData: false });
      } else {
        onResult([], { noData: true });
      }
    },

    subscribeBars: (_symbolInfo, _resolution, _onRealtimeCallback, _subscribeUID, _onResetCacheNeededCallback) => {
      console.debug("=====subscribeBars runnning");
    },
    unsubscribeBars: (_subscriberUID) => {
      console.debug("=====unsubscribeBars running");
    },
  };
  return dataFeed;
};
