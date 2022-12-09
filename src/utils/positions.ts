import { ethers } from "ethers";
import { adjustForDecimals, bigNumberify, expandDecimals, getTokenInfo, USDG_DECIMALS, USD_DECIMALS } from "src/Helpers";
import { InfoTokens, TokenInfo } from "src/types/tokens";

export function validateIncreasePositionError(infoTokens: InfoTokens, path: string[], indexToken: string, amountIn: ethers.BigNumber, sizeDelta: ethers.BigNumber, isLong: boolean): string {
  const indexTokenInfo = getTokenInfo(infoTokens, indexToken);
  const collateralTokenInfo = getTokenInfo(infoTokens, path[path.length - 1]);

  if (!collateralTokenInfo) {
    return "Unknown error: could not find collateral token info"
  }
  if (!indexTokenInfo) {
    return "Unknown error: could not find index token info"
  }

  // TODO add more increase position error

  return (
    `Could not increase ${indexTokenInfo.symbol} ${
    isLong ? "Long" : "Short"
  } within the allowed slippage, you can adjust the allowed slippage in the settings on the top right of the page.`
         )
}


export function validateDecreasePositionError(infoTokens: InfoTokens, path: string[], indexToken: string, collateralDelta: ethers.BigNumber, isLong: boolean, minOut: ethers.BigNumber): string {
  const indexTokenInfo = getTokenInfo(infoTokens, indexToken);
  const fromTokenInfo = getTokenInfo(infoTokens, path[0]);
  // if path.length >= 0 it will try and execute a swap
  const toTokenInfo = getTokenInfo(infoTokens, path[path.length - 1]);

  if (!toTokenInfo) {
    return "Unknown error: could not find out token info"
  }
  if (!indexTokenInfo) {
    return "Unknown error: could not find index token info"
  }

  const fromUsdMin = isLong ? collateralDelta : collateralDelta.mul(fromTokenInfo.minPrice)
  const toAmount = isLong ? minOut : minOut.div(toTokenInfo.maxPrice)

  // a swap is involved
  if (path.length > 1) {
    if (
      toTokenInfo &&
      toTokenInfo.availableAmount &&
      toAmount.gt(toTokenInfo.availableAmount)
    ) {
      return `There is not enough available liquidity to receive ${toTokenInfo.symbol}. Choose a different token to receive`;
    }
    if (
      toTokenInfo.bufferAmount &&
      toTokenInfo.poolAmount &&
      toTokenInfo.bufferAmount.gt(toTokenInfo.poolAmount.sub(toAmount))
    ) {
      console.log(toTokenInfo.poolAmount.toString(), toTokenInfo.bufferAmount.toString())
      return `Receiving ${toTokenInfo.symbol} will drop the token below its buffer amount. Choose a different token to receive`;
    }

    if (
      fromUsdMin &&
      fromTokenInfo.maxUsdgAmount &&
      fromTokenInfo.maxUsdgAmount.gt(0) &&
      fromTokenInfo.usdgAmount &&
      fromTokenInfo.maxPrice
    ) {
      const usdgFromAmount = adjustForDecimals(fromUsdMin, USD_DECIMALS, USDG_DECIMALS);
      const nextUsdgAmount = fromTokenInfo.usdgAmount.add(usdgFromAmount);

      if (nextUsdgAmount.gt(fromTokenInfo.maxUsdgAmount)) {
        return `Swapping ${fromTokenInfo.symbol} into the pool will push the balance overweight. Must set ${fromTokenInfo.symbol} as the receiving token`;
      }
    }
  }

  return (
      `Could not decrease ${indexTokenInfo.symbol} ${
      isLong ? "Long" : "Short"
    } within the allowed slippage, you can adjust the allowed slippage in the settings on the top right of the page.`
  )
}


