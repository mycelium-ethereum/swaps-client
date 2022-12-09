import { ethers } from "ethers";
import { adjustForDecimals, bigNumberify, expandDecimals, USDG_DECIMALS, USD_DECIMALS } from "src/Helpers";
import { TokenInfo } from "src/types/tokens";

export function validatePositionError(collateralTokenInfo: TokenInfo, indexTokenInfo: TokenInfo, amountIn: ethers.BigNumber, sizeDelta: ethers.BigNumber, isLong: boolean): string {
  if (!collateralTokenInfo) {
    return "Unknown error: could not find collateral token info"
  }
  if (!indexTokenInfo) {
    return "Unknown error: could not find index token info"
  }
    if (isLong) {
        if (!indexTokenInfo.availableAmount) {
          return "Index token liquidity data not loaded";
        }
        if (indexTokenInfo.availableAmount && amountIn.gt(indexTokenInfo.availableAmount)) {
          return "Insufficient liquidity";
        }

        if (
          indexTokenInfo.poolAmount &&
          indexTokenInfo.bufferAmount &&
          indexTokenInfo.bufferAmount.gt(indexTokenInfo.poolAmount.sub(amountIn))
        ) {
          return "Insufficient liquidity"
        }

        if (
          sizeDelta &&
          collateralTokenInfo.maxUsdgAmount &&
          collateralTokenInfo.maxUsdgAmount.gt(0) &&
          collateralTokenInfo.minPrice &&
          collateralTokenInfo.usdgAmount
        ) {
          const usdgFromAmount = adjustForDecimals(sizeDelta, USD_DECIMALS, USDG_DECIMALS);
          const nextUsdgAmount = collateralTokenInfo.usdgAmount.add(usdgFromAmount);
          if (nextUsdgAmount.gt(collateralTokenInfo.maxUsdgAmount)) {
            return `${collateralTokenInfo.symbol} pool exceeded, try different token` 
          }
        }
        if (indexTokenInfo && indexTokenInfo.maxPrice) {
          const sizeUsd = sizeDelta;
          if (
            indexTokenInfo.maxGlobalLongSize &&
            indexTokenInfo.maxGlobalLongSize.gt(0) &&
            indexTokenInfo.maxAvailableLong &&
            sizeUsd.gt(indexTokenInfo.maxAvailableLong)
          ) {
            return `Max ${indexTokenInfo.symbol} long exceeded`
          }
        }
    } else {

      if (!collateralTokenInfo.availableAmount) {
        return "Collateral token liquidity data not loaded";
      }
      if (amountIn.gt(collateralTokenInfo.availableAmount)) {
        return `Insufficient liquidity, change "Profits In"`
      }

      if (
        collateralTokenInfo.bufferAmount &&
        collateralTokenInfo.poolAmount &&
        collateralTokenInfo.bufferAmount.gt(collateralTokenInfo.poolAmount.sub(amountIn))
      ) {
        // suggest swapping to collateralToken
        return `Insufficient liquidity, change "Profits In"`
      }

      if (
        collateralTokenInfo.maxUsdgAmount &&
        collateralTokenInfo.maxUsdgAmount.gt(0) &&
        collateralTokenInfo.minPrice &&
        collateralTokenInfo.usdgAmount
      ) {
        const usdgFromAmount = adjustForDecimals(sizeDelta, USD_DECIMALS, USDG_DECIMALS);
        const nextUsdgAmount = collateralTokenInfo.usdgAmount.add(usdgFromAmount);
        if (nextUsdgAmount.gt(collateralTokenInfo.maxUsdgAmount)) {
          return `${collateralTokenInfo.symbol} pool exceeded, try different token`
        }
      }
  }

  // default message
  return (
    `Could not increase ${indexTokenInfo.symbol} ${
    isLong ? "Long" : "Short"
  } within the allowed slippage, you can adjust the allowed slippage in the settings on the top right of the page.`
         )
}
