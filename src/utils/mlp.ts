import { ethers } from "ethers";
import { BASIS_POINTS_DIVISOR, bigNumberify, formatAmount } from "src/Helpers";
import { InfoTokens } from "src/types/tokens";

type TokenList = {
  name: string,
  symbol: string,
  decimals: number,
  address: string,
  isStable: boolean,
  imageUrl: string
}[]

export function getComposition (tokenList: TokenList, infoTokens: InfoTokens, totalManagedUsd: ethers.BigNumber): ({
  stableMlp: number,
  totalMlp: number,
  mlpPool: ({
    fullname: string,
    name: string,
    value: number
  } | null)[]
}) {
  let stableMlp = 0, totalMlp = 0;
  const mlpPool = tokenList.map((token) => {
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo.managedUsd && totalManagedUsd && !totalManagedUsd.eq(0)) {
      const currentWeightBps = tokenInfo.managedUsd.mul(BASIS_POINTS_DIVISOR).div(totalManagedUsd);
      if (tokenInfo.isStable) {
        stableMlp += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      }
      totalMlp += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      return ({
        fullname: token.name,
        name: token.symbol,
        value: parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`),
      });
    }
    return null;
  });

  return ({
    stableMlp,
    totalMlp,
    mlpPool
  })
}
