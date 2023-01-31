import { ethers } from "ethers";
import { gql } from "@apollo/client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Token as UniToken } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v3-sdk";
import useSWR from "swr";

import OrderBook from "../abis/OrderBook.json";
import PositionManager from "../abis/PositionManager.json";
import Vault from "../abis/Vault.json";
import Router from "../abis/Router.json";
import LentMyc from "../abis/LentMyc.json";
import UniPool from "../abis/UniPool.json";
import Token from "../abis/Token.json";
import RewardsTracker from "../abis/RewardTracker.json";

import { getContract } from "../Addresses";
import { getConstant } from "../Constants";
import {
  ARBITRUM,
  ETHEREUM,
  bigNumberify,
  getExplorerUrl,
  setGasPrice,
  getGasLimit,
  replaceNativeTokenAddress,
  getProvider,
  getOrderKey,
  fetcher,
  parseValue,
  expandDecimals,
  helperToast,
  USD_DECIMALS,
  ETH_DECIMALS,
  ARBITRUM_GOERLI,
  SECONDS_PER_YEAR,
} from "../Helpers";
import { getTokenBySymbol } from "../data/Tokens";

import { nissohGraphClient, arbitrumGraphClient, arbitrumTestnetGraphClient } from "./common";
import { getServerUrl, getSupplyUrl } from "src/lib";
export * from "./prices";

const { AddressZero } = ethers.constants;

function getMycGraphClient(chainId) {
  if (chainId === ARBITRUM) {
    return arbitrumGraphClient;
  } else if (chainId === ARBITRUM_GOERLI) {
    return arbitrumTestnetGraphClient;
  }
  throw new Error(`Unsupported chain ${chainId}`);
}

export function useFees(chainId) {
  const query = gql(`{
    feeStat(id: "total") {
      swap
      marginAndLiquidation
      mint
      burn
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    getMycGraphClient(chainId).query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query, chainId]);

  return res ? res.data.feeStat : null;
}

export function useFeesSince(chainId, from, to) {
  const [res, setRes] = useState();

  const query = gql(`{
    feeStats(where: { id_gte: ${from}, id_lt: ${to}, period: daily }) {
      id
      marginAndLiquidation
      swap
      mint
      burn
    },
  }`);

  useEffect(() => {
    if (!from) {
      return;
    }
    getMycGraphClient(chainId)
      .query({ query })
      .then((res) => {
        if (res.data.feeStats) {
          let fees = res.data.feeStats.reduce(
            (sum, stat) => sum.add(stat.mint).add(stat.burn).add(stat.swap).add(stat.marginAndLiquidation),
            bigNumberify(0)
          );
          setRes(fees);
        }
      })
      .catch(console.warn);
  }, [setRes, query, chainId, from]);

  return res;
}

const FEE_MULTIPLIER_BASIS_POINTS = 4;
const MM_FEE_MULTIPLIER = bigNumberify(6);
const MM_SWAPS_FEE_MULTIPLIER = bigNumberify(12);

export function useSpreadCaptureVolume(chainId) {
  // spread capture turned off
  const to = 1665792441;
  const query = gql(`{
    volumeStats(first: 1000, period: daily, orderBy: id, orderDirection: desc, where: { id_lt: ${to} }) {
      margin
      liquidation
      swap
      mint
      burn
    }
  }`);

  const [res, setRes] = useState(undefined);

  useEffect(() => {
    getMycGraphClient(chainId)
      .query({ query })
      .then((res) => {
        const totalMMFees = res.data.volumeStats.reduce(
          (sum, stat) =>
            sum
              .add(MM_FEE_MULTIPLIER.mul(stat.mint))
              .add(MM_FEE_MULTIPLIER.mul(stat.burn))
              .add(MM_FEE_MULTIPLIER.mul(stat.margin))
              .add(MM_FEE_MULTIPLIER.mul(stat.liquidation))
              .add(MM_SWAPS_FEE_MULTIPLIER.mul(stat.swap)),
          bigNumberify(0)
        );
        setRes(totalMMFees.div(expandDecimals(1, FEE_MULTIPLIER_BASIS_POINTS)));
      })
      .catch(console.warn);
  }, [setRes, query, chainId]);

  return res;
}

export function useVolume(chainId) {
  const query = gql(`{
    volumeStat(id: "total") {
      margin
      liquidation
      swap
      mint
      burn
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    getMycGraphClient(chainId).query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query, chainId]);

  return res ? res.data.volumeStat : null;
}

export function useAllOrdersStats(chainId) {
  const query = gql(`{
    orderStat(id: "total") {
      openSwap
      openIncrease
      openDecrease
      executedSwap
      executedIncrease
      executedDecrease
      cancelledSwap
      cancelledIncrease
      cancelledDecrease
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    getMycGraphClient(chainId).query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query, chainId]);

  return res ? res.data.orderStat : null;
}

export function useUserStat(chainId) {
  const query = gql(`{
    userStat(id: "total") {
      id
      uniqueCount
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    getMycGraphClient(chainId).query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query, chainId]);

  return res ? res.data.userStat : null;
}

export function useLiquidationsData(chainId, account) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (account) {
      const query = gql(`{
         liquidatedPositions(
           where: {account: "${account.toLowerCase()}"}
           first: 100
           orderBy: timestamp
           orderDirection: desc
         ) {
           key
           timestamp
           borrowFee
           loss
           collateral
           size
           markPrice
           type
         }
      }`);
      const graphClient = getMycGraphClient(chainId);
      graphClient
        .query({ query })
        .then((res) => {
          const _data = res.data.liquidatedPositions.map((item) => {
            return {
              ...item,
              size: bigNumberify(item.size),
              collateral: bigNumberify(item.collateral),
              markPrice: bigNumberify(item.markPrice),
            };
          });
          setData(_data);
        })
        .catch(console.warn);
    }
  }, [setData, chainId, account]);

  return data;
}

export function useAllPositions(chainId, library) {
  const count = 1000;
  const query = gql(`{
    aggregatedTradeOpens(
      first: ${count}
    ) {
      account
      initialPosition{
        indexToken
        collateralToken
        isLong
        sizeDelta
      }
      increaseList {
        sizeDelta
      }
      decreaseList {
        sizeDelta
      }
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    nissohGraphClient.query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query]);

  const key = res ? `allPositions${count}__` : false;
  const { data: positions = [] } = useSWR(key, async () => {
    const provider = getProvider(library, chainId);
    const vaultAddress = getContract(chainId, "Vault");
    const contract = new ethers.Contract(vaultAddress, Vault.abi, provider);
    const ret = await Promise.all(
      res.data.aggregatedTradeOpens.map(async (dataItem) => {
        try {
          const { indexToken, collateralToken, isLong } = dataItem.initialPosition;
          const positionData = await contract.getPosition(dataItem.account, collateralToken, indexToken, isLong);
          const position = {
            size: bigNumberify(positionData[0]),
            collateral: bigNumberify(positionData[1]),
            entryFundingRate: bigNumberify(positionData[3]),
            account: dataItem.account,
          };
          position.fundingFee = await contract.getFundingFee(collateralToken, position.size, position.entryFundingRate);
          position.marginFee = position.size.div(1000);
          position.fee = position.fundingFee.add(position.marginFee);

          const THRESHOLD = 5000;
          const collateralDiffPercent = position.fee.mul(10000).div(position.collateral);
          position.danger = collateralDiffPercent.gt(THRESHOLD);

          return position;
        } catch (ex) {
          console.error(ex);
        }
      })
    );

    return ret.filter(Boolean);
  });

  return positions;
}

export function useAllOrders(chainId, library) {
  const query = gql(`{
    orders(
      first: 1000,
      orderBy: createdTimestamp,
      orderDirection: desc,
      where: {status: "open"}
    ) {
      type
      account
      index
      status
      createdTimestamp
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    getMycGraphClient(chainId).query({ query }).then(setRes);
  }, [setRes, query, chainId]);

  const key = res ? res.data.orders.map((order) => `${order.type}-${order.account}-${order.index}`) : null;
  const { data: orders = [] } = useSWR(key, () => {
    const provider = getProvider(library, chainId);
    const orderBookAddress = getContract(chainId, "OrderBook");
    const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, provider);
    return Promise.all(
      res.data.orders.map(async (order) => {
        try {
          const type = order.type.charAt(0).toUpperCase() + order.type.substring(1);
          const method = `get${type}Order`;
          const orderFromChain = await contract[method](order.account, order.index);
          const ret = {};
          for (const [key, val] of Object.entries(orderFromChain)) {
            ret[key] = val;
          }
          if (order.type === "swap") {
            ret.path = [ret.path0, ret.path1, ret.path2].filter((address) => address !== AddressZero);
          }
          ret.type = type;
          ret.index = order.index;
          ret.account = order.account;
          ret.createdTimestamp = order.createdTimestamp;
          return ret;
        } catch (ex) {
          console.error(ex);
        }
      })
    );
  });

  return orders.filter(Boolean);
}

export function usePositionsForOrders(chainId, library, orders) {
  const key = orders ? orders.map((order) => getOrderKey(order) + "____") : null;
  const { data: positions = {} } = useSWR(key, async () => {
    const provider = getProvider(library, chainId);
    const vaultAddress = getContract(chainId, "Vault");
    const contract = new ethers.Contract(vaultAddress, Vault.abi, provider);
    const data = await Promise.all(
      orders.map(async (order) => {
        try {
          const position = await contract.getPosition(
            order.account,
            order.collateralToken,
            order.indexToken,
            order.isLong
          );
          if (position[0].eq(0)) {
            return [null, order];
          }
          return [position, order];
        } catch (ex) {
          console.error(ex);
        }
      })
    );
    return data.reduce((memo, [position, order]) => {
      memo[getOrderKey(order)] = position;
      return memo;
    }, {});
  });

  return positions;
}

function invariant(condition, errorMsg) {
  if (!condition) {
    throw new Error(errorMsg);
  }
}

export function useTrades(chainId, account) {
  let url = getServerUrl(chainId, "/actions");
  if (account && account.length) {
    url += `&account=${account}`;
  }

  const { data, mutate: updateTrades } = useSWR(url, {
    dedupingInterval: 30000,
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  // Convert the response to match expected format
  let trades = [];
  if (Array.isArray(data)) {
    trades = data.map((datum) => {
      if (datum.dataValues) {
        return {
          id: datum.dataValues.id.toString(),
          data: {
            ...datum.dataValues,
            params: JSON.stringify(datum.dataValues.params),
          },
        };
      } else {
        return {
          id: datum.id,
          data: {
            ...datum,
            params: JSON.stringify(datum.params),
          },
        };
      }
    });
  }

  if (trades) {
    trades.sort((item0, item1) => {
      const data0 = item0.data;
      const data1 = item1.data;
      const time0 = parseInt(data0.timestamp);
      const time1 = parseInt(data1.timestamp);
      if (time1 > time0) {
        return 1;
      }
      if (time1 < time0) {
        return -1;
      }

      const block0 = parseInt(data0.blockNumber);
      const block1 = parseInt(data1.blockNumber);

      if (isNaN(block0) && isNaN(block1)) {
        return 0;
      }

      if (isNaN(block0)) {
        return 1;
      }

      if (isNaN(block1)) {
        return -1;
      }

      if (block1 > block0) {
        return 1;
      }

      if (block1 < block0) {
        return -1;
      }

      return 0;
    });
  }

  return { trades, updateTrades };
}

export function useHasOutdatedUi() {
  return { data: false };
}

export function useMYCPrice(chainId, libraries, active) {
  const arbitrumLibrary = libraries && libraries.arbitrum ? libraries.arbitrum : undefined;
  const { data: mycPriceFromArbitrum, mutate: mutateFromArbitrum } = useMYCPriceFromArbitrum(arbitrumLibrary, active);
  const { data: mycPriceFromMainnet, mutate: mutateFromMainnet } = useMYCPriceFromMainnet(active);

  const mycPrice = chainId === ARBITRUM ? mycPriceFromArbitrum : mycPriceFromMainnet;

  const mutate = useCallback(() => {
    mutateFromMainnet();
    mutateFromArbitrum();
  }, [mutateFromMainnet, mutateFromArbitrum]);

  return {
    mycPrice,
    mycPriceFromArbitrum,
    mycPriceFromMainnet,
    mutate,
  };
}

export function useTotalMYCSupply() {
  const { data: mycSupply, mutate: updateMYCSupply } = useSWR([getSupplyUrl("/totalSupply")], {
    fetcher: (...args) => fetch(...args).then((res) => res.text()),
  });

  const { data: circulatingMycSupply, mutate: updateMYCCirculatingSupply } = useSWR(
    [getSupplyUrl("/circulatingSupply")],
    {
      fetcher: (...args) => fetch(...args).then((res) => res.text()),
    }
  );

  const mutate = useCallback(() => {
    updateMYCSupply();
    updateMYCCirculatingSupply();
  }, [updateMYCSupply, updateMYCCirculatingSupply]);

  return {
    total: mycSupply ? bigNumberify(ethers.utils.parseUnits(mycSupply, 18)) : undefined,
    circulating: circulatingMycSupply ? bigNumberify(ethers.utils.parseUnits(circulatingMycSupply, 18)) : undefined,
    mutate,
  };
}

export function useTotalMYCInLiquidity() {
  let poolAddressArbitrum = {
    uniswap: getContract(ARBITRUM, "UniswapMycEthPool"),
    uniswapMycTcr: getContract(ARBITRUM, "UniswapMycTcrPool"),
    balancer: getContract(ARBITRUM, "BalancerVault"),
  };
  let poolAddressMainnet = {
    uniswap: getContract(ETHEREUM, "UniswapMycEthPool"),
    balancer: getContract(ETHEREUM, "BalancerVault"),
    // uniswap: getContract(ETHEREUM, "UniswapTcrEthPool"),
    // sushiswap: getContract(ETHEREUM, "SushiswapTcrEthPool"),
  };
  let totalMYCArbitrum = useRef(bigNumberify(0));
  let totalMYCMainnet = useRef(bigNumberify(0));

  const { data: mycInUniswapLiquidityOnArbitrum, mutate: mutateMYCInUniswapLiquidityOnArbitrum } = useSWR(
    [
      `StakeV2:mycInLiquidity:${ARBITRUM}`,
      ARBITRUM,
      getContract(ARBITRUM, "MYC"),
      "balanceOf",
      poolAddressArbitrum.uniswap,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  // TODO this pool will slowly get phased out
  const { data: mycTcrInUniswapLiquidityOnArbitrum, mutate: mutateMYCTCRInUniswapLiquidityOnArbitrum } = useSWR(
    [
      `StakeV2:mycTcrInLiquidity:${ARBITRUM}`,
      ARBITRUM,
      getContract(ARBITRUM, "MYC"),
      "balanceOf",
      poolAddressArbitrum.uniswapMycTcr,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: mycInBalancerLiquidityOnArbitrum, mutate: mutateMYCInBalancerLiquidityOnArbitrum } = useSWR(
    [
      `StakeV2:mycBalancerLiquidity:${ARBITRUM}`,
      ARBITRUM,
      getContract(ARBITRUM, "MYC"),
      "balanceOf",
      poolAddressArbitrum.balancer,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  // const { data: tcrInUniswapLiquidityOnArbitrum, mutate: mutateTCRInUniswapLiquidityOnArbitrum } = useSWR(
  // [
  // `StakeV2:tcrInLiquidity:${ARBITRUM}`,
  // ARBITRUM,
  // getContract(ARBITRUM, "TCR"),
  // "balanceOf",
  // poolAddressArbitrum.uniswapTcr,
  // ],
  // {
  // fetcher: fetcher(undefined, Token),
  // }
  // );

  // const { data: tcrInBalancerLiquidityOnArbitrum, mutate: mutateTCRInBalancerLiquidityOnArbitrum } = useSWR(
  // [
  // `StakeV2:mycBalancerLiquidity:${ARBITRUM}`,
  // ARBITRUM,
  // getContract(ARBITRUM, "TCR"),
  // "balanceOf",
  // poolAddressArbitrum.balancer,
  // ],
  // {
  // fetcher: fetcher(undefined, Token),
  // }
  // );

  const { data: mycInUniswapLiquidityOnMainnet, mutate: mutateMYCInUniswapLiquidityOnMainnet } = useSWR(
    [
      `StakeV2:mycInUniswapLiquidity:${ETHEREUM}`,
      ETHEREUM,
      getContract(ETHEREUM, "MYC"),
      "balanceOf",
      poolAddressMainnet.uniswap,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: mycInBalancerLiquidityOnMainnet, mutate: mutateMYCInBalancerLiquidityOnMainnet } = useSWR(
    [
      `StakeV2:mycBalancerLiquidity:${ETHEREUM}`,
      ETHEREUM,
      getContract(ETHEREUM, "MYC"),
      "balanceOf",
      poolAddressMainnet.balancer,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  // const { data: tcrInSushiswapLiquidityOnMainnet, mutate: mutateTCRInSushiSwapLiquidityOnMainnet } = useSWR(
  // [
  // `StakeV2:tcrInSushiswapLiquidity:${ETHEREUM}`,
  // ETHEREUM,
  // getContract(ETHEREUM, "TCR"),
  // "balanceOf",
  // poolAddressMainnet.sushiswap,
  // ],
  // {
  // fetcher: fetcher(undefined, Token),
  // }
  // );

  const mutate = useCallback(() => {
    mutateMYCInUniswapLiquidityOnArbitrum();
    mutateMYCInBalancerLiquidityOnArbitrum();
    mutateMYCTCRInUniswapLiquidityOnArbitrum();
    // mutateTCRInUniswapLiquidityOnArbitrum();
    // mutateTCRInBalancerLiquidityOnArbitrum();

    mutateMYCInUniswapLiquidityOnMainnet();
    // mutateTCRInSushiSwapLiquidityOnMainnet();
    mutateMYCInBalancerLiquidityOnMainnet();
  }, [
    mutateMYCInUniswapLiquidityOnArbitrum,
    mutateMYCInBalancerLiquidityOnArbitrum,
    mutateMYCTCRInUniswapLiquidityOnArbitrum,
    // mutateTCRInUniswapLiquidityOnArbitrum,
    // mutateTCRInBalancerLiquidityOnArbitrum,

    mutateMYCInUniswapLiquidityOnMainnet,
    // mutateTCRInSushiSwapLiquidityOnMainnet,
    mutateMYCInBalancerLiquidityOnMainnet,
  ]);

  if (mycInUniswapLiquidityOnMainnet && mycInBalancerLiquidityOnMainnet && mycTcrInUniswapLiquidityOnArbitrum) {
    let total = bigNumberify(mycInUniswapLiquidityOnMainnet)
      .add(mycInBalancerLiquidityOnMainnet)
      .add(mycTcrInUniswapLiquidityOnArbitrum);
    totalMYCMainnet.current = total;
  }

  if (mycInUniswapLiquidityOnArbitrum && mycInBalancerLiquidityOnArbitrum) {
    let total = bigNumberify(mycInUniswapLiquidityOnArbitrum).add(mycInBalancerLiquidityOnArbitrum);
    totalMYCArbitrum.current = total;
  }

  return {
    mainnet: totalMYCMainnet.current,
    arbitrum: totalMYCArbitrum.current,
    total: totalMYCArbitrum.current.add(totalMYCMainnet.current),
    mutate,
  };
}

function useMYCPriceFromMainnet(active) {
  const poolAddress = getContract(ETHEREUM, "UniswapMycEthPool");
  const { data: mycEthUniPoolSlot0, mutate: updateTcrEthUniPoolSlot0 } = useSWR(
    [`StakeV2:mainnetUniPoolSlot0:${active}`, ETHEREUM, poolAddress, "slot0"],
    {
      fetcher: fetcher(undefined, UniPool),
    }
  );

  const ethPoolAddress = getContract(ETHEREUM, "UniswapEthUsdcPool");
  const { data: ethUsdcUniPoolSlot0, mutate: updateEthUsdcUniPoolSlot0 } = useSWR(
    [`StakeV2:mainnetEthPrice:${active}`, ETHEREUM, ethPoolAddress, "slot0"],
    {
      fetcher: fetcher(undefined, UniPool),
    }
  );

  const mycPrice = useMemo(() => {
    if (mycEthUniPoolSlot0 && ethUsdcUniPoolSlot0) {
      const ethAddress = getContract(ETHEREUM, "WETH");
      const ETH = new UniToken(ETHEREUM, ethAddress, 18, "SYMBOL", "NAME");

      const usdcAddress = getContract(ETHEREUM, "USDC");
      const USDC = new UniToken(ETHEREUM, usdcAddress, 18, "SYMBOL", "NAME");

      const ethUsdcPool = new Pool(ETH, USDC, 0, ethUsdcUniPoolSlot0.sqrtPriceX96, 1, ethUsdcUniPoolSlot0.tick);

      const mycAddress = getContract(ETHEREUM, "TCR");
      const MYC = new UniToken(ETHEREUM, mycAddress, 18, "SYMBOL", "NAME");

      const mycEthPool = new Pool(
        ETH, // tokenA
        MYC, // tokenB
        10000, // fee
        mycEthUniPoolSlot0.sqrtPriceX96, // sqrtRatioX96
        1, // liquidity
        mycEthUniPoolSlot0.tick, // tickCurrent
        []
      );

      const ethPrice = ethUsdcPool.priceOf(ETH).toSignificant(6);
      // USDC is 6 decimals need to parse into 18 + 6 decimal places
      const ethPriceAmount = parseValue(ethPrice, 24);
      const poolTokenPrice = mycEthPool.priceOf(MYC).toSignificant(6);
      const poolTokenPriceAmount = parseValue(poolTokenPrice, 18);
      // here everything is in 10 ** 24 precision
      return poolTokenPriceAmount.mul(ethPriceAmount);
    }
  }, [ethUsdcUniPoolSlot0, mycEthUniPoolSlot0]);

  const mutate = useCallback(() => {
    updateTcrEthUniPoolSlot0(undefined, true);
    updateEthUsdcUniPoolSlot0(undefined, true);
  }, [updateEthUsdcUniPoolSlot0, updateTcrEthUniPoolSlot0]);

  return { data: mycPrice, mutate };
}

function useMYCPriceFromArbitrum(library, active) {
  // liquidity is too low for uniswap on arbitrum can use tcr for now
  const poolAddress = getContract(ARBITRUM, "UniswapTcrEthPool");
  // const poolAddress = getContract(ARBITRUM, "UniswapMycEthPool");
  const { data: uniPoolSlot0, mutate: updateUniPoolSlot0 } = useSWR(
    [`StakeV2:uniPoolSlot0:${active}`, ARBITRUM, poolAddress, "slot0"],
    {
      fetcher: fetcher(library, UniPool),
    }
  );

  const vaultAddress = getContract(ARBITRUM, "Vault");
  const ethAddress = getTokenBySymbol(ARBITRUM, "WETH").address;
  const { data: ethPrice, mutate: updateEthPrice } = useSWR(
    [`StakeV2:ethPrice:${active}`, ARBITRUM, vaultAddress, "getMinPrice", ethAddress],
    {
      fetcher: fetcher(library, Vault),
    }
  );

  const mycPrice = useMemo(() => {
    if (uniPoolSlot0 && ethPrice) {
      const tokenA = new UniToken(ARBITRUM, ethAddress, 18, "SYMBOL", "NAME");

      const mycAddress = getContract(ARBITRUM, "MYC");
      const tokenB = new UniToken(ARBITRUM, mycAddress, 18, "SYMBOL", "NAME");

      const pool = new Pool(
        tokenA, // tokenA
        tokenB, // tokenB
        10000, // fee
        uniPoolSlot0.sqrtPriceX96, // sqrtRatioX96
        1, // liquidity
        uniPoolSlot0.tick, // tickCurrent
        []
      );

      const poolTokenPrice = pool.priceOf(tokenB).toSignificant(6);
      const poolTokenPriceAmount = parseValue(poolTokenPrice, 18);
      return poolTokenPriceAmount.mul(ethPrice).div(expandDecimals(1, 18));
    }
  }, [ethPrice, uniPoolSlot0, ethAddress]);

  const mutate = useCallback(() => {
    updateUniPoolSlot0(undefined, true);
    updateEthPrice(undefined, true);
  }, [updateEthPrice, updateUniPoolSlot0]);

  return { data: mycPrice, mutate };
}

export async function approvePlugin(
  chainId,
  pluginAddress,
  { library, pendingTxns, setPendingTxns, sentMsg, failMsg }
) {
  const routerAddress = getContract(chainId, "Router");
  const contract = new ethers.Contract(routerAddress, Router.abi, library.getSigner());
  return callContract(chainId, contract, "approvePlugin", [pluginAddress], {
    sentMsg,
    failMsg,
    pendingTxns,
    setPendingTxns,
  });
}

export async function createSwapOrder(
  chainId,
  library,
  path,
  amountIn,
  minOut,
  triggerRatio,
  nativeTokenAddress,
  opts = {}
) {
  const executionFee = getConstant(chainId, "SWAP_ORDER_EXECUTION_GAS_FEE");
  const triggerAboveThreshold = false;
  let shouldWrap = false;
  let shouldUnwrap = false;
  opts.value = executionFee;

  if (path[0] === AddressZero) {
    shouldWrap = true;
    opts.value = opts.value.add(amountIn);
  }
  if (path[path.length - 1] === AddressZero) {
    shouldUnwrap = true;
  }
  path = replaceNativeTokenAddress(path, nativeTokenAddress);

  const params = [path, amountIn, minOut, triggerRatio, triggerAboveThreshold, executionFee, shouldWrap, shouldUnwrap];

  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, "createSwapOrder", params, opts);
}

export async function createIncreaseOrder(
  chainId,
  library,
  nativeTokenAddress,
  path,
  amountIn,
  indexTokenAddress,
  minOut,
  sizeDelta,
  collateralTokenAddress,
  isLong,
  triggerPrice,
  opts = {}
) {
  invariant(!isLong || indexTokenAddress === collateralTokenAddress, "invalid token addresses");
  invariant(indexTokenAddress !== AddressZero, "indexToken is 0");
  invariant(collateralTokenAddress !== AddressZero, "collateralToken is 0");

  const fromETH = path[0] === AddressZero;

  path = replaceNativeTokenAddress(path, nativeTokenAddress);
  const shouldWrap = fromETH;
  const triggerAboveThreshold = !isLong;
  const executionFee = getConstant(chainId, "INCREASE_ORDER_EXECUTION_GAS_FEE");

  const params = [
    path,
    amountIn,
    indexTokenAddress,
    minOut,
    sizeDelta,
    collateralTokenAddress,
    isLong,
    triggerPrice,
    triggerAboveThreshold,
    executionFee,
    shouldWrap,
  ];

  if (!opts.value) {
    opts.value = fromETH ? amountIn.add(executionFee) : executionFee;
  }

  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, "createIncreaseOrder", params, opts);
}

export async function createDecreaseOrder(
  chainId,
  library,
  indexTokenAddress,
  sizeDelta,
  collateralTokenAddress,
  collateralDelta,
  isLong,
  triggerPrice,
  triggerAboveThreshold,
  opts = {}
) {
  invariant(!isLong || indexTokenAddress === collateralTokenAddress, "invalid token addresses");
  invariant(indexTokenAddress !== AddressZero, "indexToken is 0");
  invariant(collateralTokenAddress !== AddressZero, "collateralToken is 0");

  const executionFee = getConstant(chainId, "DECREASE_ORDER_EXECUTION_GAS_FEE");

  const params = [
    indexTokenAddress,
    sizeDelta,
    collateralTokenAddress,
    collateralDelta,
    isLong,
    triggerPrice,
    triggerAboveThreshold,
  ];
  opts.value = executionFee;
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, "createDecreaseOrder", params, opts);
}

export async function cancelSwapOrder(chainId, library, index, opts) {
  const params = [index];
  const method = "cancelSwapOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function cancelDecreaseOrder(chainId, library, index, opts) {
  const params = [index];
  const method = "cancelDecreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function cancelIncreaseOrder(chainId, library, index, opts) {
  const params = [index];
  const method = "cancelIncreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function cancelMultipleOrders(chainId, library, swapIndexes, increaseIndexes, decreaseIndexes, opts) {
  const params = [swapIndexes, increaseIndexes, decreaseIndexes];
  const method = "cancelMultiple";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateDecreaseOrder(
  chainId,
  orderBookAddress,
  library,
  index,
  collateralDelta,
  sizeDelta,
  triggerPrice,
  triggerAboveThreshold,
  opts
) {
  const params = [index, collateralDelta, sizeDelta, triggerPrice, triggerAboveThreshold];
  const method = "updateDecreaseOrder";
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateIncreaseOrder(
  chainId,
  orderBookAddress,
  library,
  index,
  sizeDelta,
  triggerPrice,
  triggerAboveThreshold,
  opts
) {
  const params = [index, sizeDelta, triggerPrice, triggerAboveThreshold];
  const method = "updateIncreaseOrder";
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateSwapOrder(
  chainId,
  orderBookAddress,
  library,
  index,
  minOut,
  triggerRatio,
  triggerAboveThreshold,
  opts
) {
  const params = [index, minOut, triggerRatio, triggerAboveThreshold];
  const method = "updateSwapOrder";
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function _executeOrder(chainId, library, method, account, index, feeReceiver, opts) {
  const params = [account, index, feeReceiver];
  const positionManagerAddress = getContract(chainId, "PositionManager");
  const contract = new ethers.Contract(positionManagerAddress, PositionManager.abi, library.getSigner());
  return callContract(chainId, contract, method, params, opts);
}

export function executeSwapOrder(chainId, library, account, index, feeReceiver, opts) {
  return _executeOrder(chainId, library, "executeSwapOrder", account, index, feeReceiver, opts);
}

export function executeIncreaseOrder(chainId, library, account, index, feeReceiver, opts) {
  return _executeOrder(chainId, library, "executeIncreaseOrder", account, index, feeReceiver, opts);
}

export function executeDecreaseOrder(chainId, library, account, index, feeReceiver, opts) {
  return _executeOrder(chainId, library, "executeDecreaseOrder", account, index, feeReceiver, opts);
}

const NOT_ENOUGH_FUNDS = "NOT_ENOUGH_FUNDS";
const USER_DENIED = "USER_DENIED";
const SLIPPAGE = "SLIPPAGE";
const TX_ERROR_PATTERNS = {
  [NOT_ENOUGH_FUNDS]: ["not enough funds for gas", "failed to execute call with revert code InsufficientGasFunds"],
  [USER_DENIED]: ["User denied transaction signature"],
  [SLIPPAGE]: ["Router: mark price lower than limit", "Router: mark price higher than limit"],
};
export function extractError(ex) {
  if (!ex) {
    return [];
  }
  const message = ex.data?.message || ex.message;
  if (!message) {
    return [];
  }
  for (const [type, patterns] of Object.entries(TX_ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (message.includes(pattern)) {
        return [message, type];
      }
    }
  }
  return [message];
}

function ToastifyDebug(props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="Toastify-debug">
      {!open && (
        <span className="Toastify-debug-button" onClick={() => setOpen(true)}>
          Show error
        </span>
      )}
      {open && props.children}
    </div>
  );
}

export function useStakingApr(mycPrice, ethPrice) {
  const [stakingApr, setStakingApr] = useState(null);

  // apr is annualised rewards (USD value) / total staked (USD value) * 100
  const { data: tokensPerInterval } = useSWR(
    [
      `useStakingApr:tokensPerInterval:${ARBITRUM}`,
      ARBITRUM,
      getContract(ARBITRUM, "MYCStakingRewards"),
      "tokensPerInterval",
    ],
    {
      fetcher: fetcher(undefined, RewardsTracker),
    }
  );

  const mycTokenAddress = getContract(ARBITRUM, "MYC");
  const { data: mycDeposited } = useSWR(
    [
      `useStakingApr:totalDepositSupply(MYC):${ARBITRUM}`,
      ARBITRUM,
      getContract(ARBITRUM, "MYCStakingRewards"),
      "totalDepositSupply",
    ],
    {
      fetcher: fetcher(undefined, RewardsTracker, mycTokenAddress),
    }
  );

  const esMycTokenAddress = getContract(ARBITRUM, "ES_MYC");
  const { data: esMycDeposited } = useSWR(
    [
      `useStakingApr:totalDepositSupply(esMYC):${ARBITRUM}`,
      ARBITRUM,
      getContract(ARBITRUM, "MYCStakingRewards"),
      "totalDepositSupply",
    ],
    {
      fetcher: fetcher(undefined, RewardsTracker, esMycTokenAddress),
    }
  );

  useEffect(() => {
    if (ethPrice?.gt(0) && mycPrice?.gt(0) && tokensPerInterval && mycDeposited && esMycDeposited) {
      const tokensPerYear = tokensPerInterval.mul(SECONDS_PER_YEAR);
      const annualRewardsUsd = tokensPerYear.mul(ethPrice);

      const totalDepositTokens = mycDeposited.add(esMycDeposited);
      const totalDepositsUsd = totalDepositTokens.mul(mycPrice);

      const aprPrecision = 10;
      const apr = annualRewardsUsd.mul(expandDecimals(1, aprPrecision)).div(totalDepositsUsd);

      const formattedApr = (apr.toNumber() / 10 ** aprPrecision) * 100;
      setStakingApr(formattedApr.toFixed(2));
    }
  }, [ethPrice, mycPrice, tokensPerInterval, mycDeposited, esMycDeposited]);

  return stakingApr;
}

export function useTotalStaked() {
  const [totalStakedMyc, setTotalStakedMyc] = useState(null);

  const { data: mycAssetsInStaking } = useSWR(
    [`DashboardV2:mycInStaking:${ARBITRUM}`, ARBITRUM, getContract(ARBITRUM, "LentMYC"), "totalAssets"],
    {
      fetcher: fetcher(undefined, LentMyc),
    }
  );

  const { data: pendingMycDepositsInStaking } = useSWR(
    [`DashboardV2:pendingMycInStaking:${ARBITRUM}`, ARBITRUM, getContract(ARBITRUM, "LentMYC"), "pendingDeposits"],
    {
      fetcher: fetcher(undefined, LentMyc),
    }
  );

  useEffect(() => {
    if (mycAssetsInStaking && pendingMycDepositsInStaking && !totalStakedMyc) {
      const mycDeposited = mycAssetsInStaking.add(pendingMycDepositsInStaking).div(expandDecimals(1, ETH_DECIMALS));

      if (!totalStakedMyc) {
        setTotalStakedMyc(mycDeposited);
      }
    }
  }, [mycAssetsInStaking, pendingMycDepositsInStaking, totalStakedMyc]);

  return totalStakedMyc;
}

export async function callContract(chainId, contract, method, params, opts) {
  try {
    if (!Array.isArray(params) && typeof params === "object" && opts === undefined) {
      opts = params;
      params = [];
    }
    if (!opts) {
      opts = {};
    }

    const txnOpts = {};

    if (opts.value) {
      txnOpts.value = opts.value;
    }

    txnOpts.gasLimit = opts.gasLimit ? opts.gasLimit : await getGasLimit(contract, method, params, opts.value);

    await setGasPrice(txnOpts, contract.provider, chainId);

    const res = await contract[method](...params, txnOpts);
    const txUrl = getExplorerUrl(chainId) + "tx/" + res.hash;
    const sentMsg = opts.sentMsg || "Transaction sent.";
    helperToast.success(
      <div>
        {sentMsg}{" "}
        <a href={txUrl} target="_blank" rel="noopener noreferrer">
          View status.
        </a>
        <br />
      </div>
    );
    if (opts.setPendingTxns) {
      const pendingTxn = {
        hash: res.hash,
        message: opts.successMsg || "Transaction completed!",
      };

      opts.setPendingTxns((pendingTxns) => [...pendingTxns, pendingTxn]);
    }
    return res;
  } catch (e) {
    let failMsg;
    const [message, type] = extractError(e);
    switch (type) {
      case NOT_ENOUGH_FUNDS:
        failMsg = (
          <div>
            There is not enough ETH in your account on Arbitrum to send this transaction.
            <br />
            <br />
            <a href={"https://arbitrum.io/bridge-tutorial/"} target="_blank" rel="noopener noreferrer">
              Bridge ETH to Arbitrum
            </a>
          </div>
        );
        break;
      case USER_DENIED:
        failMsg = "Transaction was cancelled.";
        break;
      case SLIPPAGE:
        failMsg =
          'The mark price has changed, consider increasing your Allowed Slippage by clicking on the "..." icon next to your address.';
        break;
      default:
        failMsg = (
          <div>
            {opts.failMsg || "Transaction failed."}
            <br />
            {message && <ToastifyDebug>{message}</ToastifyDebug>}
          </div>
        );
    }
    helperToast.error(failMsg);
    throw e;
  }
}

export function useMlpPrices(chainId, currentMlpPrice) {
  const query = gql(`{
    mlpStats(
      first: 1000,
      orderBy: id,
      orderDirection: asc,
      where: { period: daily }
    ) {
      id
      aumInUsdg
      mlpSupply
      distributedUsd
      distributedEth
    },
    feeStats (
      first: 1000,
      orderBy: id,
      orderDirection: asc,
      where: { period: daily }
    ) {
      id
      margin
      marginAndLiquidation
      swap
      liquidation
      mint
      burn
    }
  }`);

  const [data, setData] = useState();

  useEffect(() => {
    getMycGraphClient(chainId).query({ query }).then(setData).catch(console.warn);
  }, [setData, query, chainId]);

  let cumulativeDistributedUsdPerMlp = 0;
  let cumulativeDistributedEthPerMlp = 0;
  const mlpChartData = useMemo(() => {
    if (!data) {
      return null;
    }

    let prevMlpSupply;
    let prevAum;

    const feeStatsById = data.data.feeStats.reduce(
      (o, stat) => ({
        ...o,
        [stat.id]: ethers.BigNumber.from(stat.marginAndLiquidation).add(stat.swap).add(stat.mint).add(stat.burn),
      }),
      {}
    );

    let cumulativeFees = ethers.BigNumber.from(0);
    let ret = data.data.mlpStats
      .filter((item) => item.id % 86400 === 0)
      .reduce((memo, item, i) => {
        const last = memo[memo.length - 1];

        const aum = Number(item.aumInUsdg) / 1e18;
        const mlpSupply = Number(item.mlpSupply) / 1e18;

        const distributedUsd = Number(item.distributedUsd) / 1e30;
        const distributedUsdPerMlp = distributedUsd / mlpSupply || 0;
        cumulativeDistributedUsdPerMlp += distributedUsdPerMlp;

        const distributedEth = Number(item.distributedEth) / 1e18;
        const distributedEthPerMlp = distributedEth / mlpSupply || 0;
        cumulativeDistributedEthPerMlp += distributedEthPerMlp;

        const feeStat = feeStatsById[item.id] ?? ethers.BigNumber.from(0);
        cumulativeFees = cumulativeFees.add(feeStat);
        const totalFees = parseFloat(ethers.utils.formatUnits(cumulativeFees, USD_DECIMALS));

        const mlpPrice = aum / mlpSupply;
        const mlpPriceWithFees = (totalFees + aum) / mlpSupply;

        const timestamp = parseInt(item.id);

        const newItem = {
          time: timestamp,
          aum,
          mlpSupply,
          value: mlpPrice,
          mlpPriceWithFees: mlpPriceWithFees,
          cumulativeDistributedEthPerMlp,
          cumulativeDistributedUsdPerMlp,
          distributedUsdPerMlp,
          distributedEthPerMlp,
        };
        if (i === data.data.mlpStats.length - 1 && currentMlpPrice) {
          newItem.mlpPriceWithFees = Number.isNaN(mlpPrice)
            ? parseFloat(ethers.utils.formatUnits(currentMlpPrice, USD_DECIMALS))
            : mlpPriceWithFees;
          newItem.value = parseFloat(ethers.utils.formatUnits(currentMlpPrice, USD_DECIMALS));
        }

        if (last && last.timestamp === timestamp) {
          memo[memo.length - 1] = newItem;
        } else {
          memo.push(newItem);
        }
        return memo;
      }, [])
      .map((item) => {
        let { mlpSupply, aum } = item;
        if (!mlpSupply) {
          mlpSupply = prevMlpSupply;
        }
        if (!aum) {
          aum = prevAum;
        }
        item.mlpSupplyChange = prevMlpSupply ? ((mlpSupply - prevMlpSupply) / prevMlpSupply) * 100 : 0;
        if (item.mlpSupplyChange > 1000) item.mlpSupplyChange = 0;
        item.aumChange = prevAum ? ((aum - prevAum) / prevAum) * 100 : 0;
        if (item.aumChange > 1000) item.aumChange = 0;
        prevMlpSupply = mlpSupply;
        prevAum = aum;
        return item;
      });

    // ret = fillNa(ret);
    return ret;
  }, [data, currentMlpPrice]);

  return mlpChartData;
}
