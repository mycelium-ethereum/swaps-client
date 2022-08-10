import React, { useState } from "react";
import useSWR from "swr";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import {
  ARBITRUM,
  AVALANCHE,
  PLACEHOLDER_ACCOUNT,
  useChainId,
  fetcher,
  formatAmount,
  formatAmountFree,
  parseValue,
  bigNumberify,
} from "../../Helpers";

import { getContract } from "../../Addresses";

import { callContract } from "../../Api";

import Token from "../../abis/Token.json";
import RewardReader from "../../abis/RewardReader.json";

import Checkbox from "../../components/Checkbox/Checkbox";

import "./ClaimEsMyc.css";

import arbitrumIcon from "../../img/ic_arbitrum_96.svg";
import avaIcon from "../../img/ic_avalanche_96.svg";

const VEST_WITH_MYC_ARB = "VEST_WITH_MYC_ARB";
const VEST_WITH_MLP_ARB = "VEST_WITH_MLP_ARB";
const VEST_WITH_MYC_AVAX = "VEST_WITH_MYC_AVAX";
const VEST_WITH_MLP_AVAX = "VEST_WITH_MLP_AVAX";

export function getVestingDataV2(vestingInfo) {
  if (!vestingInfo || vestingInfo.length === 0) {
    return;
  }

  const keys = ["mycVester", "mlpVester"];
  const data = {};
  const propsLength = 12;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    data[key] = {
      pairAmount: vestingInfo[i * propsLength],
      vestedAmount: vestingInfo[i * propsLength + 1],
      escrowedBalance: vestingInfo[i * propsLength + 2],
      claimedAmounts: vestingInfo[i * propsLength + 3],
      claimable: vestingInfo[i * propsLength + 4],
      maxVestableAmount: vestingInfo[i * propsLength + 5],
      combinedAverageStakedAmount: vestingInfo[i * propsLength + 6],
      cumulativeReward: vestingInfo[i * propsLength + 7],
      transferredCumulativeReward: vestingInfo[i * propsLength + 8],
      bonusReward: vestingInfo[i * propsLength + 9],
      averageStakedAmount: vestingInfo[i * propsLength + 10],
      transferredAverageStakedAmount: vestingInfo[i * propsLength + 11],
    };

    data[key + "PairAmount"] = data[key].pairAmount;
    data[key + "VestedAmount"] = data[key].vestedAmount;
    data[key + "EscrowedBalance"] = data[key].escrowedBalance;
    data[key + "ClaimSum"] = data[key].claimedAmounts.add(data[key].claimable);
    data[key + "Claimable"] = data[key].claimable;
    data[key + "MaxVestableAmount"] = data[key].maxVestableAmount;
    data[key + "CombinedAverageStakedAmount"] = data[key].combinedAverageStakedAmount;
    data[key + "CumulativeReward"] = data[key].cumulativeReward;
    data[key + "TransferredCumulativeReward"] = data[key].transferredCumulativeReward;
    data[key + "BonusReward"] = data[key].bonusReward;
    data[key + "AverageStakedAmount"] = data[key].averageStakedAmount;
    data[key + "TransferredAverageStakedAmount"] = data[key].transferredAverageStakedAmount;
  }

  return data;
}

function getVestingValues({ minRatio, amount, vestingDataItem }) {
  if (!vestingDataItem || !amount || amount.eq(0)) {
    return;
  }

  let currentRatio = bigNumberify(0);

  const ratioMultiplier = 10000;
  const maxVestableAmount = vestingDataItem.maxVestableAmount;
  const nextMaxVestableEsMyc = maxVestableAmount.add(amount);

  const combinedAverageStakedAmount = vestingDataItem.combinedAverageStakedAmount;
  if (maxVestableAmount.gt(0)) {
    currentRatio = combinedAverageStakedAmount.mul(ratioMultiplier).div(maxVestableAmount);
  }

  const transferredCumulativeReward = vestingDataItem.transferredCumulativeReward;
  const nextTransferredCumulativeReward = transferredCumulativeReward.add(amount);
  const cumulativeReward = vestingDataItem.cumulativeReward;
  const totalCumulativeReward = cumulativeReward.add(nextTransferredCumulativeReward);

  let nextCombinedAverageStakedAmount = combinedAverageStakedAmount;

  if (combinedAverageStakedAmount.lt(totalCumulativeReward.mul(minRatio))) {
    const averageStakedAmount = vestingDataItem.averageStakedAmount;
    let nextTransferredAverageStakedAmount = totalCumulativeReward.mul(minRatio);
    nextTransferredAverageStakedAmount = nextTransferredAverageStakedAmount.sub(
      averageStakedAmount.mul(cumulativeReward).div(totalCumulativeReward)
    );
    nextTransferredAverageStakedAmount = nextTransferredAverageStakedAmount
      .mul(totalCumulativeReward)
      .div(nextTransferredCumulativeReward);

    nextCombinedAverageStakedAmount = averageStakedAmount
      .mul(cumulativeReward)
      .div(totalCumulativeReward)
      .add(nextTransferredAverageStakedAmount.mul(nextTransferredCumulativeReward).div(totalCumulativeReward));
  }

  const nextRatio = nextCombinedAverageStakedAmount.mul(ratioMultiplier).div(nextMaxVestableEsMyc);

  const initialStakingAmount = currentRatio.mul(maxVestableAmount);
  const nextStakingAmount = nextRatio.mul(nextMaxVestableEsMyc);

  return {
    maxVestableAmount,
    currentRatio,
    nextMaxVestableEsMyc,
    nextRatio,
    initialStakingAmount,
    nextStakingAmount,
  };
}

export default function ClaimEsMyc({ setPendingTxns }) {
  const { active, account, library } = useWeb3React();
  const { chainId } = useChainId();
  const [selectedOption, setSelectedOption] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [value, setValue] = useState("");

  const isArbitrum = chainId === ARBITRUM;

  const esMycIouAddress = getContract(chainId, "ES_MYC_IOU");

  const { data: esMycIouBalance } = useSWR(
    isArbitrum && [
      `ClaimEsMyc:esMycIouBalance:${active}`,
      chainId,
      esMycIouAddress,
      "balanceOf",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const arbRewardReaderAddress = getContract(ARBITRUM, "RewardReader");
  const avaxRewardReaderAddress = getContract(AVALANCHE, "RewardReader");

  const arbVesterAdddresses = [getContract(ARBITRUM, "MycVester"), getContract(ARBITRUM, "MlpVester")];
  const avaxVesterAdddresses = [getContract(AVALANCHE, "MycVester"), getContract(AVALANCHE, "MlpVester")];

  const { data: arbVestingInfo } = useSWR(
    [
      `StakeV2:vestingInfo:${active}`,
      ARBITRUM,
      arbRewardReaderAddress,
      "getVestingInfoV2",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(undefined, RewardReader, [arbVesterAdddresses]),
    }
  );

  const { data: avaxVestingInfo } = useSWR(
    [
      `StakeV2:vestingInfo:${active}`,
      AVALANCHE,
      avaxRewardReaderAddress,
      "getVestingInfoV2",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(undefined, RewardReader, [avaxVesterAdddresses]),
    }
  );

  const arbVestingData = getVestingDataV2(arbVestingInfo);
  const avaxVestingData = getVestingDataV2(avaxVestingInfo);

  let amount = parseValue(value, 18);

  let maxVestableAmount;
  let currentRatio;

  let nextMaxVestableEsMyc;
  let nextRatio;

  let initialStakingAmount;
  let nextStakingAmount;

  let stakingToken = "staked MYC";

  const shouldShowStakingAmounts = false;

  if (selectedOption === VEST_WITH_MYC_ARB && arbVestingData) {
    const result = getVestingValues({
      minRatio: bigNumberify(4),
      amount,
      vestingDataItem: arbVestingData.mycVester,
    });

    if (result) {
      ({ maxVestableAmount, currentRatio, nextMaxVestableEsMyc, nextRatio, initialStakingAmount, nextStakingAmount } =
        result);
    }
  }

  if (selectedOption === VEST_WITH_MLP_ARB && arbVestingData) {
    const result = getVestingValues({
      minRatio: bigNumberify(320),
      amount,
      vestingDataItem: arbVestingData.mlpVester,
    });

    if (result) {
      ({ maxVestableAmount, currentRatio, nextMaxVestableEsMyc, nextRatio, initialStakingAmount, nextStakingAmount } =
        result);
    }

    stakingToken = "MLP";
  }

  if (selectedOption === VEST_WITH_MYC_AVAX && avaxVestingData) {
    const result = getVestingValues({
      minRatio: bigNumberify(4),
      amount,
      vestingDataItem: avaxVestingData.mycVester,
    });

    if (result) {
      ({ maxVestableAmount, currentRatio, nextMaxVestableEsMyc, nextRatio, initialStakingAmount, nextStakingAmount } =
        result);
    }
  }

  if (selectedOption === VEST_WITH_MLP_AVAX && avaxVestingData) {
    const result = getVestingValues({
      minRatio: bigNumberify(320),
      amount,
      vestingDataItem: avaxVestingData.mlpVester,
    });

    if (result) {
      ({ maxVestableAmount, currentRatio, nextMaxVestableEsMyc, nextRatio, initialStakingAmount, nextStakingAmount } =
        result);
    }

    stakingToken = "MLP";
  }

  const getError = () => {
    if (!active) {
      return "Wallet not connected";
    }

    if (esMycIouBalance && esMycIouBalance.eq(0)) {
      return "No esMYC to claim";
    }

    if (!amount || amount.eq(0)) {
      return "Enter an amount";
    }

    if (selectedOption === "") {
      return "Select an option";
    }

    return false;
  };

  const error = getError();

  const getPrimaryText = () => {
    if (error) {
      return error;
    }

    if (isClaiming) {
      return "Claiming...";
    }

    return "Claim";
  };

  const isPrimaryEnabled = () => {
    return !error && !isClaiming;
  };

  const claim = () => {
    setIsClaiming(true);

    let receiver;

    if (selectedOption === VEST_WITH_MYC_ARB) {
      receiver = "0x544a6ec142Aa9A7F75235fE111F61eF2EbdC250a";
    }

    if (selectedOption === VEST_WITH_MLP_ARB) {
      receiver = "0x9d8f6f6eE45275A5Ca3C6f6269c5622b1F9ED515";
    }

    if (selectedOption === VEST_WITH_MYC_AVAX) {
      receiver = "0x171a321A78dAE0CDC0Ba3409194df955DEEcA746";
    }

    if (selectedOption === VEST_WITH_MLP_AVAX) {
      receiver = "0x28863Dd19fb52DF38A9f2C6dfed40eeB996e3818";
    }

    const contract = new ethers.Contract(esMycIouAddress, Token.abi, library.getSigner());
    callContract(chainId, contract, "transfer", [receiver, amount], {
      sentMsg: "Claim submitted!",
      failMsg: "Claim failed.",
      successMsg: "Claim completed!",
      setPendingTxns,
    })
      .then(async (res) => {})
      .finally(() => {
        setIsClaiming(false);
      });
  };

  return (
    <div className="ClaimEsMyc Page page-layout">
      <div className="Page-title-section mt-0">
        <div className="Page-title">Claim esMYC</div>
        {!isArbitrum && (
          <div className="Page-description">
            <br />
            Please switch your network to Arbitrum.
          </div>
        )}
        {isArbitrum && (
          <div>
            <div className="Page-description">
              <br />
              You have {formatAmount(esMycIouBalance, 18, 2, true)} esMYC (IOU) tokens.
              <br />
              <br />
              The address of the esMYC (IOU) token is {esMycIouAddress}.<br />
              The esMYC (IOU) token is transferrable. You can add the token to your wallet and send it to another
              address to claim if you'd like.
              <br />
              <br />
              Select your vesting option below then click "Claim".
              <br />
              After claiming, the esMYC tokens will be airdropped to your account on the selected network within 7 days.{" "}
              <br />
              The esMYC tokens can be staked or vested at any time.
              <br />
              Your esMYC (IOU) balance will decrease by your claim amount after claiming, this is expected behaviour.
              <br />
              You can check your claim history{" "}
              <a
                href={`https://arbiscan.io/token/${esMycIouAddress}?a=${account}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>
              .
            </div>
            <br />
            <div className="ClaimEsMyc-vesting-options">
              <Checkbox
                className="arbitrum btn btn-primary btn-left btn-lg"
                isChecked={selectedOption === VEST_WITH_MYC_ARB}
                setIsChecked={() => setSelectedOption(VEST_WITH_MYC_ARB)}
              >
                <div className="ClaimEsMyc-option-label">Vest with MYC on Arbitrum</div>
                <img src={arbitrumIcon} alt="arbitrum" />
              </Checkbox>
              <Checkbox
                className="arbitrum btn btn-primary btn-left btn-lg"
                isChecked={selectedOption === VEST_WITH_MLP_ARB}
                setIsChecked={() => setSelectedOption(VEST_WITH_MLP_ARB)}
              >
                <div className="ClaimEsMyc-option-label">Vest with MLP on Arbitrum</div>
                <img src={arbitrumIcon} alt="arbitrum" />
              </Checkbox>
              <Checkbox
                className="avalanche btn btn-primary btn-left btn-lg"
                isChecked={selectedOption === VEST_WITH_MYC_AVAX}
                setIsChecked={() => setSelectedOption(VEST_WITH_MYC_AVAX)}
              >
                <div className="ClaimEsMyc-option-label">Vest with MYC on Avalanche</div>
                <img src={avaIcon} alt="avalanche" />
              </Checkbox>
              <Checkbox
                className="avalanche btn btn-primary btn-left btn-lg"
                isChecked={selectedOption === VEST_WITH_MLP_AVAX}
                setIsChecked={() => setSelectedOption(VEST_WITH_MLP_AVAX)}
              >
                <div className="ClaimEsMyc-option-label avalanche">Vest with MLP on Avalanche</div>
                <img src={avaIcon} alt="avalanche" />
              </Checkbox>
            </div>
            <br />
            {!error && (
              <div className="muted">
                You can currently vest a maximum of {formatAmount(maxVestableAmount, 18, 2, true)} esMYC tokens at a
                ratio of {formatAmount(currentRatio, 4, 2, true)} {stakingToken} to 1 esMYC.{" "}
                {shouldShowStakingAmounts && `${formatAmount(initialStakingAmount, 18, 2, true)}.`}
                <br />
                After claiming you will be able to vest a maximum of {formatAmount(
                  nextMaxVestableEsMyc,
                  18,
                  2,
                  true
                )}{" "}
                esMYC at a ratio of {formatAmount(nextRatio, 4, 2, true)} {stakingToken} to 1 esMYC.{" "}
                {shouldShowStakingAmounts && `${formatAmount(nextStakingAmount, 18, 2, true)}.`}
                <br />
                <br />
              </div>
            )}
            <div>
              <div className="ClaimEsMyc-input-label muted">Amount to claim</div>
              <div className="ClaimEsMyc-input-container">
                <input type="number" placeholder="0.0" value={value} onChange={(e) => setValue(e.target.value)} />
                {value !== formatAmountFree(esMycIouBalance, 18, 18) && (
                  <div
                    className="ClaimEsMyc-max-button"
                    onClick={() => setValue(formatAmountFree(esMycIouBalance, 18, 18))}
                  >
                    MAX
                  </div>
                )}
              </div>
            </div>
            <br />
            <div>
              <button className="App-cta Exchange-swap-button" disabled={!isPrimaryEnabled()} onClick={() => claim()}>
                {getPrimaryText()}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
