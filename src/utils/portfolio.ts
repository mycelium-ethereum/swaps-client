import { BigNumber } from 'ethers';

const ZERO_BN = BigNumber.from(0);

export const getPnl = (isLong: boolean, averagePrice: BigNumber, priceChange: BigNumber, size: BigNumber): {
  isUp: boolean;
  percentage: BigNumber;
  amount: BigNumber;
} => {
  if (isLong && averagePrice && priceChange && size) {
    const priceDelta = averagePrice.gt(priceChange) ? averagePrice.sub(priceChange) : priceChange.sub(averagePrice);
    const hasProfit = isLong ? priceChange.gt(averagePrice) : averagePrice.gt(priceChange);
    const delta = size.mul(priceDelta).div(averagePrice);
    const pnlAmount = hasProfit ? delta : delta.mul(-1);
    const percentageDifference = averagePrice.gt(0) ? priceDelta.mul(100).div(averagePrice) : ZERO_BN;
    return { isUp: hasProfit, percentage: percentageDifference, amount: pnlAmount };
  }
  else {
    return {
      isUp: false,
      percentage: ZERO_BN,
      amount: ZERO_BN,
    };
  }
};
