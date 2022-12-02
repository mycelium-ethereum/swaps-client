import { BigNumber, ethers } from 'ethers';

const ZERO_BN = BigNumber.from(0);

export const getPnl = (isLong: boolean, averagePrice: BigNumber, priceChange: BigNumber, size: BigNumber): {
  isUp: boolean;
  percentageChange: number;
  percentageChangeBN: BigNumber;
  amount: BigNumber;
} => {
  if (averagePrice && priceChange && size) {
    const priceDelta = averagePrice.gt(priceChange) ? averagePrice.sub(priceChange) : priceChange.sub(averagePrice);
    const hasProfit = isLong ? priceChange.gt(averagePrice) : averagePrice.gt(priceChange);
    const delta = size.mul(priceDelta).div(averagePrice);
    const percentageChange = averagePrice.gt(0) ? parseFloat(ethers.utils.formatUnits(priceDelta)) / parseFloat(ethers.utils.formatUnits(averagePrice)) * 100 : 0;
    const percentageChangeBN = averagePrice.gt(0) ? priceDelta.mul(100).div(averagePrice) : ZERO_BN;

    return { isUp: hasProfit, percentageChange, percentageChangeBN, amount: delta };
  }
  else {
    return {
      isUp: false,
      percentageChange: 0,
      percentageChangeBN: ZERO_BN,
      amount: ZERO_BN,
    };
  }
};

