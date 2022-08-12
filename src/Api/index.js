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
import UniPool from "../abis/UniPool.json";
import Token from "../abis/Token.json";
import VaultReader from "../abis/VaultReader.json";
import ReferralStorage from "../abis/ReferralStorage.json";

import { getContract } from "../Addresses";
import { getConstant } from "../Constants";
import {
  UI_VERSION,
  ARBITRUM,
  AVALANCHE,
  ARBITRUM_TESTNET,
  ETHEREUM,
  // DEFAULT_GAS_LIMIT,
  bigNumberify,
  getExplorerUrl,
  getServerUrl,
  setGasPrice,
  getGasLimit,
  replaceNativeTokenAddress,
  getProvider,
  getOrderKey,
  fetcher,
  parseValue,
  expandDecimals,
  getInfoTokens,
  isAddressZero,
  helperToast,
} from "../Helpers";
import { getTokens, getTokenBySymbol, getWhitelistedTokens } from "../data/Tokens";

import { nissohGraphClient, arbitrumGraphClient, avalancheGraphClient } from "./common";
import { getTracerServerUrl } from "./rewards";
export * from "./prices";

const { AddressZero } = ethers.constants;

function getMycGraphClient(chainId) {
  if (chainId === ARBITRUM) {
    return arbitrumGraphClient;
  } else if (chainId === ARBITRUM_TESTNET) {
    return arbitrumGraphClient;
  } else if (chainId === AVALANCHE) {
    return avalancheGraphClient;
  }
  throw new Error(`Unsupported chain ${chainId}`);
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

export function useInfoTokens(library, chainId, active, tokenBalances, fundingRateInfo, vaultPropsLength) {
  const tokens = getTokens(chainId);
  const vaultReaderAddress = getContract(chainId, "VaultReader");
  const vaultAddress = getContract(chainId, "Vault");
  const positionRouterAddress = getContract(chainId, "PositionRouter");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);

  const { data: vaultTokenInfo } = useSWR(
    [`useInfoTokens:${active}`, chainId, vaultReaderAddress, "getVaultTokenInfoV3"],
    {
      fetcher: fetcher(library, VaultReader, [
        vaultAddress,
        positionRouterAddress,
        nativeTokenAddress,
        expandDecimals(1, 18),
        whitelistedTokenAddresses,
      ]),
    }
  );

  const indexPricesUrl = getTracerServerUrl(chainId, "/prices");
  const { data: indexPrices } = useSWR([indexPricesUrl], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
    refreshInterval: 500,
    refreshWhenHidden: true,
  });

  return {
    infoTokens: getInfoTokens(
      tokens,
      tokenBalances,
      whitelistedTokens,
      vaultTokenInfo,
      fundingRateInfo,
      vaultPropsLength,
      indexPrices,
      nativeTokenAddress
    ),
  };
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
  let url = getTracerServerUrl(chainId, "/actions");
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
    trades = data.map((datum) => ({
      id: datum.dataValues.id.toString(),
      data: {
        ...datum.dataValues,
        params: JSON.stringify(datum.dataValues.params),
      },
    }));
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

export function useStakedMycSupply(library, active) {
  const mycAddressArb = getContract(ARBITRUM, "MYC");
  const stakedMycTrackerAddressArb = getContract(ARBITRUM, "StakedMycTracker");

  const { data: arbData, mutate: arbMutate } = useSWR(
    [`StakeV2:stakedMycSupply:${active}`, ARBITRUM, mycAddressArb, "balanceOf", stakedMycTrackerAddressArb],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const mycAddressAvax = getContract(AVALANCHE, "MYC");
  const stakedMycTrackerAddressAvax = getContract(AVALANCHE, "StakedMycTracker");

  const { data: avaxData, mutate: avaxMutate } = useSWR(
    [`StakeV2:stakedMycSupply:${active}`, AVALANCHE, mycAddressAvax, "balanceOf", stakedMycTrackerAddressAvax],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  let data;
  if (arbData && avaxData) {
    data = arbData.add(avaxData);
  }

  const mutate = () => {
    arbMutate();
    avaxMutate();
  };

  return { data, mutate };
}

export function useHasOutdatedUi() {
  const url = getServerUrl(ARBITRUM, "/ui_version");
  const { data, mutate } = useSWR([url], {
    fetcher: (...args) => fetch(...args).then((res) => res.text()),
  });

  let hasOutdatedUi = false;

  if (data && parseFloat(data) > parseFloat(UI_VERSION)) {
    hasOutdatedUi = true;
  }

  return { data: hasOutdatedUi, mutate };
}

export function useTCRPrice(chainId, libraries, active) {
  const arbitrumLibrary = libraries && libraries.arbitrum ? libraries.arbitrum : undefined;
  const { data: tcrPriceFromArbitrum, mutate: mutateFromArbitrum } = useTCRPriceFromArbitrum(arbitrumLibrary, active);
  const { data: tcrPriceFromMainnet, mutate: mutateFromMainnet } = useTCRPriceFromMainnet(active);

  const tcrPrice = chainId === ARBITRUM ? tcrPriceFromArbitrum : tcrPriceFromMainnet;

  const mutate = useCallback(() => {
    mutateFromMainnet();
    mutateFromArbitrum();
  }, [mutateFromMainnet, mutateFromArbitrum]);

  return {
    tcrPrice,
    tcrPriceFromArbitrum,
    tcrPriceFromMainnet,
    mutate,
  };
}

export function useTotalTCRSupply() {
  const tcrSupplyUrl = "https://stats.tracer.finance/supply";

  const { data: tcrSupply, mutate: updateTCRSupply } = useSWR([tcrSupplyUrl], {
    fetcher: (...args) => fetch(...args, { headers: { "Content-Type": "application/json" } }).then((res) => res.json()),
  });

  return {
    total: tcrSupply?.totalSupply ? bigNumberify(tcrSupply.totalSupply) : undefined,
    mutate: updateTCRSupply,
  };
}

export function useTotalMycStaked() {
  const stakedMycTrackerAddressArbitrum = getContract(ARBITRUM, "StakedMycTracker");
  const stakedMycTrackerAddressAvax = getContract(AVALANCHE, "StakedMycTracker");
  let totalStakedMyc = useRef(bigNumberify(0));
  const { data: stakedMycSupplyArbitrum, mutate: updateStakedMycSupplyArbitrum } = useSWR(
    [
      `StakeV2:stakedMycSupply:${ARBITRUM}`,
      ARBITRUM,
      getContract(ARBITRUM, "MYC"),
      "balanceOf",
      stakedMycTrackerAddressArbitrum,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );
  const { data: stakedMycSupplyAvax, mutate: updateStakedMycSupplyAvax } = useSWR(
    [
      `StakeV2:stakedMycSupply:${AVALANCHE}`,
      AVALANCHE,
      getContract(AVALANCHE, "MYC"),
      "balanceOf",
      stakedMycTrackerAddressAvax,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const mutate = useCallback(() => {
    updateStakedMycSupplyArbitrum();
    updateStakedMycSupplyAvax();
  }, [updateStakedMycSupplyArbitrum, updateStakedMycSupplyAvax]);

  if (stakedMycSupplyArbitrum && stakedMycSupplyAvax) {
    let total = bigNumberify(stakedMycSupplyArbitrum).add(stakedMycSupplyAvax);
    totalStakedMyc.current = total;
  }

  return {
    avax: stakedMycSupplyAvax,
    arbitrum: stakedMycSupplyArbitrum,
    total: totalStakedMyc.current,
    mutate,
  };
}

export function useTotalTCRInLiquidity() {
  let poolAddressArbitrum = {
    uniswap: getContract(ARBITRUM, "UniswapTcrEthPool"),
    balancer: getContract(ARBITRUM, "BalancerTcrEthPool"),
  };
  let poolAddressMainnet = {
    uniswap: getContract(ETHEREUM, "UniswapTcrEthPool"),
    sushiswap: getContract(ETHEREUM, "SushiswapTcrEthPool"),
  };
  let totalTCRArbitrum = useRef(bigNumberify(0));
  let totalTCRMainnet = useRef(bigNumberify(0));

  const { data: tcrInUniswapLiquidityOnArbitrum, mutate: mutateTCRInUniswapLiquidityOnArbitrum } = useSWR(
    [
      `StakeV2:tcrInLiquidity:${ARBITRUM}`,
      ARBITRUM,
      getContract(ARBITRUM, "TCR"),
      "balanceOf",
      poolAddressArbitrum.uniswap,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: tcrInBalancerLiquidityOnArbitrum, mutate: mutateTCRInBalancerLiquidityOnArbitrum } = useSWR(
    [
      `StakeV2:tcrBalancerLiquidity:${ARBITRUM}`,
      ARBITRUM,
      getContract(ARBITRUM, "TCR"),
      "balanceOf",
      poolAddressArbitrum.balancer,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: tcrInUniswapLiquidityOnMainnet, mutate: mutateTCRInUniswapLiquidityOnMainnet } = useSWR(
    [
      `StakeV2:tcrInUniswapLiquidity:${ETHEREUM}`,
      ETHEREUM,
      getContract(ETHEREUM, "TCR"),
      "balanceOf",
      poolAddressMainnet.uniswap,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: tcrInSushiswapLiquidityOnMainnet, mutate: mutateTCRInSushiSwapLiquidityOnMainnet } = useSWR(
    [
      `StakeV2:tcrInSushiswapLiquidity:${ETHEREUM}`,
      ETHEREUM,
      getContract(ETHEREUM, "TCR"),
      "balanceOf",
      poolAddressMainnet.sushiswap,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const mutate = useCallback(() => {
    mutateTCRInUniswapLiquidityOnArbitrum();
    mutateTCRInBalancerLiquidityOnArbitrum();
    mutateTCRInUniswapLiquidityOnMainnet();
    mutateTCRInSushiSwapLiquidityOnMainnet();
  }, [
    mutateTCRInUniswapLiquidityOnArbitrum,
    mutateTCRInBalancerLiquidityOnArbitrum,
    mutateTCRInUniswapLiquidityOnMainnet,
    mutateTCRInSushiSwapLiquidityOnMainnet,
  ]);

  if (tcrInSushiswapLiquidityOnMainnet && tcrInUniswapLiquidityOnMainnet) {
    let total = bigNumberify(tcrInSushiswapLiquidityOnMainnet).add(tcrInUniswapLiquidityOnMainnet);
    totalTCRMainnet.current = total;
  }

  if (tcrInUniswapLiquidityOnArbitrum && tcrInBalancerLiquidityOnArbitrum) {
    let total = bigNumberify(tcrInUniswapLiquidityOnArbitrum).add(tcrInBalancerLiquidityOnArbitrum);
    totalTCRArbitrum.current = total;
  }

  return {
    mainnet: totalTCRMainnet.current,
    arbitrum: totalTCRArbitrum.current,
    total: totalTCRArbitrum.current.add(totalTCRMainnet.current),
    mutate,
  };
}

export function useUserReferralCode(library, chainId, account) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const { data: userReferralCode, mutate: mutateUserReferralCode } = useSWR(
    account && [`ReferralStorage:traderReferralCodes`, chainId, referralStorageAddress, "traderReferralCodes", account],
    {
      fetcher: fetcher(library, ReferralStorage),
    }
  );
  return {
    userReferralCode,
    mutateUserReferralCode,
  };
}
export function useReferrerTier(library, chainId, account) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const { data: referrerTier, mutate: mutateReferrerTier } = useSWR(
    account && [`ReferralStorage:referrerTiers`, chainId, referralStorageAddress, "referrerTiers", account],
    {
      fetcher: fetcher(library, ReferralStorage),
    }
  );
  return {
    referrerTier,
    mutateReferrerTier,
  };
}
export function useCodeOwner(library, chainId, account, code) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const { data: codeOwner, mutate: mutateCodeOwner } = useSWR(
    account && code && [`ReferralStorage:codeOwners`, chainId, referralStorageAddress, "codeOwners", code],
    {
      fetcher: fetcher(library, ReferralStorage),
    }
  );
  return {
    codeOwner,
    mutateCodeOwner,
  };
}

function useTCRPriceFromMainnet(active) {
  const poolAddress = getContract(ETHEREUM, "UniswapTcrEthPool");
  const { data: tcrEthUniPoolSlot0, mutate: updateTcrEthUniPoolSlot0 } = useSWR(
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
    if (tcrEthUniPoolSlot0 && ethUsdcUniPoolSlot0) {
      const ethAddress = getContract(ETHEREUM, "WETH");
      const ETH = new UniToken(ETHEREUM, ethAddress, 18, "SYMBOL", "NAME");

      const usdcAddress = getContract(ETHEREUM, "USDC");
      const USDC = new UniToken(ETHEREUM, usdcAddress, 18, "SYMBOL", "NAME");

      const ethUsdcPool = new Pool(ETH, USDC, 0, ethUsdcUniPoolSlot0.sqrtPriceX96, 1, ethUsdcUniPoolSlot0.tick);

      const tcrAddress = getContract(ETHEREUM, "TCR");
      const TCR = new UniToken(ETHEREUM, tcrAddress, 18, "SYMBOL", "NAME");

      const tcrEthPool = new Pool(
        ETH, // tokenA
        TCR, // tokenB
        10000, // fee
        tcrEthUniPoolSlot0.sqrtPriceX96, // sqrtRatioX96
        1, // liquidity
        tcrEthUniPoolSlot0.tick, // tickCurrent
        []
      );

      const ethPrice = ethUsdcPool.priceOf(ETH).toSignificant(6);
      // USDC is 6 decimals need to parse into 18 + 6 decimal places
      const ethPriceAmount = parseValue(ethPrice, 24);
      const poolTokenPrice = tcrEthPool.priceOf(TCR).toSignificant(6);
      const poolTokenPriceAmount = parseValue(poolTokenPrice, 18);
      // here everything is in 10 ** 24 precision
      return poolTokenPriceAmount.mul(ethPriceAmount);
    }
  }, [ethUsdcUniPoolSlot0, tcrEthUniPoolSlot0]);

  const mutate = useCallback(() => {
    updateTcrEthUniPoolSlot0(undefined, true);
    updateEthUsdcUniPoolSlot0(undefined, true);
  }, [updateEthUsdcUniPoolSlot0, updateTcrEthUniPoolSlot0]);

  return { data: mycPrice, mutate };
}

function useTCRPriceFromArbitrum(library, active) {
  const poolAddress = getContract(ARBITRUM, "UniswapTcrEthPool");
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

      const tcrAddress = getContract(ARBITRUM, "TCR");
      const tokenB = new UniToken(ARBITRUM, tcrAddress, 18, "SYMBOL", "NAME");

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

export async function registerReferralCode(chainId, referralCode, { library, ...props }) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const contract = new ethers.Contract(referralStorageAddress, ReferralStorage.abi, library.getSigner());
  return callContract(chainId, contract, "registerCode", [referralCode], { ...props });
}
export async function setTraderReferralCodeByUser(chainId, referralCode, { library, ...props }) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const contract = new ethers.Contract(referralStorageAddress, ReferralStorage.abi, library.getSigner());
  const codeOwner = await contract.codeOwners(referralCode);
  if (isAddressZero(codeOwner)) {
    helperToast.error("Referral code does not exist");
    return new Promise((resolve, reject) => {
      reject();
    });
  }
  return callContract(chainId, contract, "setTraderReferralCodeByUser", [referralCode], {
    ...props,
  });
}
export async function getReferralCodeOwner(chainId, referralCode) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const provider = getProvider(null, chainId);
  const contract = new ethers.Contract(referralStorageAddress, ReferralStorage.abi, provider);
  const codeOwner = await contract.codeOwners(referralCode);
  return codeOwner;
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

export async function updateDecreaseOrder(
  chainId,
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
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateIncreaseOrder(
  chainId,
  library,
  index,
  sizeDelta,
  triggerPrice,
  triggerAboveThreshold,
  opts
) {
  const params = [index, sizeDelta, triggerPrice, triggerAboveThreshold];
  const method = "updateIncreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateSwapOrder(chainId, library, index, minOut, triggerRatio, triggerAboveThreshold, opts) {
  const params = [index, minOut, triggerRatio, triggerAboveThreshold];
  const method = "updateSwapOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
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
