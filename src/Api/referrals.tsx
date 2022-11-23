import { ethers } from "ethers";
import { gql } from "@apollo/client";
import { useState, useEffect } from "react";

import { ARBITRUM, bigNumberify, isAddressZero, helperToast, getProvider, fetcher, ARBITRUM_GOERLI } from "../Helpers";
import { arbitrumReferralsGraphClient, arbitrumTestnetReferralsGraphClient } from "./common";
import { getContract } from "../Addresses";

import ReferralStorage from "../abis/ReferralStorage.json";
import { callContract } from ".";
import useSWR from "swr";
import { ChainId, Library } from "../types/common";
import { MAX_REFERRAL_CODE_LENGTH } from "../config/referrals";
import { Text } from "src/components/Translation/Text";

const ACTIVE_CHAINS = [ARBITRUM];

function getGraphClient(chainId: ChainId) {
  if (chainId === ARBITRUM) {
    return arbitrumReferralsGraphClient;
  } else if (chainId === ARBITRUM_GOERLI) {
    return arbitrumTestnetReferralsGraphClient;
  }
  throw new Error(`Unsupported chain ${chainId}`);
}

const DISTRIBUTION_TYPE_REBATES = "1";
const DISTRIBUTION_TYPE_DISCOUNT = "2";

export function decodeReferralCode(hexCode: string) {
  try {
    return ethers.utils.parseBytes32String(hexCode);
  } catch (ex) {
    let code = "";
    hexCode = hexCode.substring(2);
    for (let i = 0; i < 32; i++) {
      code += String.fromCharCode(parseInt(hexCode.substring(i * 2, i * 2 + 2), 16));
    }
    return code.trim();
  }
}

export function encodeReferralCode(code: string) {
  let final = code.replace(/[^\w\s_]/g, ""); // replace everything other than numbers, string  and underscor to ''
  if (final.length > MAX_REFERRAL_CODE_LENGTH) {
    return ethers.constants.HashZero;
  }

  return ethers.utils.formatBytes32String(final);
}

export async function validateReferralCodeExists(referralCode: string, chainId: ChainId) {
  const referralCodeBytes32 = encodeReferralCode(referralCode);
  const referralCodeOwner = await getReferralCodeOwner(chainId, referralCodeBytes32);
  return !isAddressZero(referralCodeOwner);
}

export async function registerReferralCode(chainId: ChainId, referralCode: string, { library, ...props }) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const contract = new ethers.Contract(referralStorageAddress, ReferralStorage.abi, library.getSigner());
  return callContract(chainId, contract, "registerCode", [referralCode], { ...props });
}

export async function setTraderReferralCodeByUser(chainId: ChainId, referralCode: string, { library, ...props }) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const contract = new ethers.Contract(referralStorageAddress, ReferralStorage.abi, library.getSigner());
  const codeOwner = await contract.codeOwners(referralCode);
  if (isAddressZero(codeOwner)) {
    helperToast.error(<Text>Referral code does not exist</Text>);
    return new Promise((resolve, reject) => {
      reject();
    });
  }
  return callContract(chainId, contract, "setTraderReferralCodeByUser", [referralCode], {
    ...props,
  });
}

export async function getReferralCodeOwner(chainId: ChainId, referralCode: string) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const provider = getProvider(null, chainId);
  const contract = new ethers.Contract(referralStorageAddress, ReferralStorage.abi, provider);
  const codeOwner = await contract.codeOwners(referralCode);
  return codeOwner;
}

export async function getReferralCodeTakenStatus(account: string, referralCode: string, chainId: ChainId) {
  const referralCodeBytes32 = encodeReferralCode(referralCode);
  const ownerArbitrum = await getReferralCodeOwner(ARBITRUM, referralCodeBytes32);

  const taken =
    !isAddressZero(ownerArbitrum) && (ownerArbitrum !== account || (ownerArbitrum === account && chainId === ARBITRUM));

  const referralCodeTakenInfo = {
    taken,
    ownerArbitrum,
  };

  if (taken) {
    return { status: "taken", info: referralCodeTakenInfo };
  }
  return { status: "none", info: referralCodeTakenInfo };
}

async function getCodeOwnersData(chainId: ChainId, account: string, codes: string[]) {
  const referralCodeOwnerQuery = (referralCode: string) =>
    gql(
      `{
      referralCodes(where: {code: "${referralCode}"}) {
        owner
      }
    }`
    );

  return Promise.all(
    codes.map(async (code) => {
      return getGraphClient(chainId)
        .query({ query: referralCodeOwnerQuery(code) })
        .then(({ data }) => {
          const owner = data.referralCodes[0]?.owner;
          return {
            code,
            codeString: decodeReferralCode(code),
            owner,
            isTaken: !!owner,
            isTakenByCurrentUser: owner && String(owner).toLowerCase() === String(account).toLowerCase(),
          };
        });
    })
  );
}

export function useUserCodesOnAllChain(account: string) {
  const [data, setData] = useState(null);
  const query = gql(
    `{
      referralCodes (
      first: 1000,
      where: {
        owner: "${(account || "").toLowerCase()}"
      }) {
      code
      }
    }`
  );

  useEffect(() => {
    async function main() {
      const [arbitrumCodes] = await Promise.all(
        ACTIVE_CHAINS.map((chainId) =>
          getGraphClient(chainId)
            .query({ query })
            .then(({ data }) => {
              return data.referralCodes.map((c: { code: string }) => c.code);
            })
        )
      );
      const codeOwnersOnArbitrum = await getCodeOwnersData(ARBITRUM, account, arbitrumCodes);
      setData({
        [ARBITRUM]: codeOwnersOnArbitrum.reduce((acc, cv) => {
          acc[cv.code] = cv;
          return acc;
        }, {}),
      });
    }

    main();
  }, [account, query]);

  return data;
}

export async function getCodeByAccount(account: string) {
  const query = gql(
    `{
      referralCodes (
      first: 1000,
      where: {
        owner: "${(account || "").toLowerCase()}"
      }) {
      code
      }
    }`
  );

  const [arbitrumCodes] = await Promise.all(
    ACTIVE_CHAINS.map((chainId) =>
      getGraphClient(chainId)
        .query({ query })
        .then(({ data }) => {
          return data.referralCodes.map((c: { code: string }) => c.code);
        })
    )
  );
  const codeOwnersOnArbitrum = await getCodeOwnersData(ARBITRUM, account, arbitrumCodes);
  const data = {
    [ARBITRUM]: codeOwnersOnArbitrum.reduce((acc, cv) => {
      acc[cv.code] = cv;
      return acc;
    }, {}),
  };

  return data;
}

export function useUserReferralCode(library: Library, chainId: ChainId, account: string) {
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

export function useReferrerTier(library: Library, chainId: ChainId, account: string) {
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

export function useCodeOwner(library: Library, chainId: ChainId, account: string, code: string) {
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

export function useReferralsData(chainId: ChainId, account: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const ownerOnOtherChain = useUserCodesOnAllChain(account);
  useEffect(() => {
    if (!chainId || !account) {
      setLoading(false);
      return;
    }
    const startOfDayTimestamp = Math.floor(Math.floor(Date.now() / 1000) / 86400) * 86400;
    const query = gql`
      query referralData($typeIds: [String!]!, $account: String!, $timestamp: Int!, $referralTotalStatsId: String!) {
        distributions(
          first: 1000
          orderBy: timestamp
          orderDirection: desc
          where: { receiver: $account, typeId_in: $typeIds }
        ) {
          receiver
          amount
          typeId
          token
          transactionHash
          timestamp
        }
        referrerTotalStats: referrerStats(
          first: 1000
          orderBy: volume
          orderDirection: desc
          where: { period: total, referrer: $account }
        ) {
          referralCode
          volume
          trades
          tradedReferralsCount
          registeredReferralsCount
          totalRebateUsd
          discountUsd
        }
        referrerLastDayStats: referrerStats(
          first: 1000
          where: { period: daily, referrer: $account, timestamp: $timestamp }
        ) {
          referralCode
          volume
          trades
          tradedReferralsCount
          registeredReferralsCount
          totalRebateUsd
          discountUsd
        }
        referralCodes(first: 1000, where: { owner: $account }) {
          code
        }
        referralTotalStats: referralStat(id: $referralTotalStatsId) {
          volume
          discountUsd
        }
        referrerTierInfo: referrer(id: $account) {
          tierId
          id
          discountShare
        }
      }
    `;
    setLoading(true);

    getGraphClient(chainId)
      .query({
        query,
        variables: {
          typeIds: [DISTRIBUTION_TYPE_REBATES, DISTRIBUTION_TYPE_DISCOUNT],
          account: (account || "").toLowerCase(),
          timestamp: startOfDayTimestamp,
          referralTotalStatsId: account && `total:0:${account.toLowerCase()}`,
        },
      })
      .then((res) => {
        const rebateDistributions = [];
        const discountDistributions = [];
        res.data.distributions.forEach((d: any) => {
          const item = {
            timestamp: parseInt(d.timestamp),
            transactionHash: d.transactionHash,
            receiver: ethers.utils.getAddress(d.receiver),
            amount: bigNumberify(d.amount),
            typeId: d.typeId,
            token: ethers.utils.getAddress(d.token),
          };
          if (d.typeId === DISTRIBUTION_TYPE_REBATES) {
            rebateDistributions.push(item);
          } else {
            discountDistributions.push(item);
          }
        });

        function prepareStatsItem(e: any) {
          return {
            volume: bigNumberify(e.volume),
            trades: parseInt(e.trades),
            tradedReferralsCount: parseInt(e.tradedReferralsCount),
            registeredReferralsCount: parseInt(e.registeredReferralsCount),
            totalRebateUsd: bigNumberify(e.totalRebateUsd),
            discountUsd: bigNumberify(e.discountUsd),
            referralCode: decodeReferralCode(e.referralCode),
            ownerOnOtherChain: ownerOnOtherChain?.[chainId][e.referralCode],
          };
        }

        function getCumulativeStats(data = []) {
          return data.reduce(
            (acc, cv) => {
              acc.totalRebateUsd = acc.totalRebateUsd.add(cv.totalRebateUsd);
              acc.volume = acc.volume.add(cv.volume);
              acc.discountUsd = acc.discountUsd.add(cv.discountUsd);
              acc.trades = acc.trades + cv.trades;
              acc.tradedReferralsCount = acc.tradedReferralsCount + cv.tradedReferralsCount;
              acc.registeredReferralsCount = acc.registeredReferralsCount + cv.registeredReferralsCount;
              return acc;
            },
            {
              totalRebateUsd: bigNumberify(0),
              volume: bigNumberify(0),
              discountUsd: bigNumberify(0),
              trades: 0,
              tradedReferralsCount: 0,
              registeredReferralsCount: 0,
            }
          );
        }

        let referrerTotalStats = res.data.referrerTotalStats.map(prepareStatsItem);
        setData({
          rebateDistributions,
          discountDistributions,
          referrerTotalStats,
          referrerTierInfo: res.data.referrerTierInfo,
          referrerLastDayStats: res.data.referrerLastDayStats.map(prepareStatsItem),
          cumulativeStats: getCumulativeStats(referrerTotalStats),
          codes: res.data.referralCodes.map((e: { code: string }) => decodeReferralCode(e.code)),
          referralTotalStats: res.data.referralTotalStats
            ? {
                volume: bigNumberify(res.data.referralTotalStats.volume),
                discountUsd: bigNumberify(res.data.referralTotalStats.discountUsd),
              }
            : {
                volume: bigNumberify(0),
                discountUsd: bigNumberify(0),
              },
        });
      })
      .catch(console.warn)
      .finally(() => {
        setLoading(false);
      });
  }, [setData, chainId, account, ownerOnOtherChain]);

  return {
    data: data || null,
    loading,
  };
}
