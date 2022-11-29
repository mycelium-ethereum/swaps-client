import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";

import Modal from "../../components/Modal/Modal";
import Tooltip from "../../components/Tooltip/Tooltip";

import Vault from "../../abis/Vault.json";
import ReaderV2 from "../../abis/ReaderV2.json";
import Vester from "../../abis/Vester.json";
import RewardTracker from "../../abis/RewardTracker.json";
import RewardRouter from "../../abis/RewardRouter.json";
import RewardReader from "../../abis/RewardReader.json";
import Token from "../../abis/Token.json";
import MlpManager from "../../abis/MlpManager.json";
import { USD_PRICE_PRECISION, WalletBalance } from "../../components/Stake/Sections";
import { CompatibleTokenEnum } from "../../components/Stake/types";
import { ethers } from "ethers";
import {
  helperToast,
  bigNumberify,
  fetcher,
  formatAmount,
  formatKeyAmount,
  formatAmountFree,
  getChainName,
  parseValue,
  approveTokens,
  useLocalStorageSerializeKey,
  useChainId,
  MLP_DECIMALS,
  USD_DECIMALS,
  ARBITRUM,
  PLACEHOLDER_ACCOUNT,
  getBalanceAndSupplyData,
  getDepositBalanceData,
  getVestingData,
  getStakingData,
  getProcessedData,
  getPageTitle,
  expandDecimals,
  ETH_DECIMALS,
  ARBITRUM_GOERLI,
} from "../../Helpers";
import {
  callContract,
  useMYCPrice,
  useStakingApr,
  useUserStakingBalances,
  useStakingValues,
  useTotalMYCSupply,
} from "../../Api";
import { getConstant } from "../../Constants";

import useSWR from "swr";

import { getContract } from "../../Addresses";

import mlp40Icon from "../../img/ic_mlp_40.svg";
import myc40Icon from "../../img/ic_myc_40.svg";
import * as StakeV2Styled from "./StakeV2Styles";

import "./StakeV2.css";

import SEO from "../../components/Common/SEO";
import ClaimModal from "./ClaimModal";
import Toggle from "../../components/Toggle/Toggle";
import MlpPriceChart from "./MlpPriceChart";
import { ZERO_BN } from "src/components/Stake/presets";
import { formatNumberWithCommas, parseBigNumberToString } from "src/utils/common";
import { TokenIcon } from "src/components/Stake/TokenIcon";

const MYC_TOKEN = "MYC";
const ES_MYC_TOKEN = "esMYC";
const STAKE = "Stake";
const UNSTAKE = "Unstake";

function CompoundModal(props) {
  const {
    isVisible,
    setIsVisible,
    rewardRouterAddress,
    active,
    account,
    library,
    chainId,
    setPendingTxns,
    totalVesterRewards,
    nativeTokenSymbol,
    wrappedTokenSymbol,
    processedData,
    vesterAddress,
    stakedMlpTrackerAddress,
    esMycAddress,
  } = props;
  const [isCompounding, setIsCompounding] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const [shouldClaimMyc, setShouldClaimMyc] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-myc"],
    true
  );

  const [shouldClaimEsMyc, setShouldClaimEsMyc] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-esMyc"],
    true
  );

  const [shouldBuyMlpWithEth, setShouldBuyMlpWithEth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-buy-mlp"],
    true
  );

  const mycAddress = getContract(chainId, "MYC");
  const [isApproving, setIsApproving] = useState(false);

  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, mycAddress, "allowance", account, stakedMlpTrackerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const needApproval = tokenAllowance && totalVesterRewards && totalVesterRewards.gt(tokenAllowance);

  const isPrimaryEnabled = () => {
    return !isCompounding && !isApproving && !isCompounding && !isDepositing;
  };

  const getPrimaryText = () => {
    if (isApproving) {
      return `Approving MYC...`;
    }
    if (needApproval) {
      return `Approve MYC`;
    }
    if (isCompounding) {
      return "Compounding...";
    }
    if (isDepositing) {
      return "Depositing...";
    }
    return "Compound";
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: mycAddress,
        spender: stakedMlpTrackerAddress,
        chainId,
      });
      return;
    }

    setIsCompounding(true);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(
      chainId,
      contract,
      "handleRewards",
      [
        shouldClaimMyc, // shouldClaimMyc,
        false, // shouldStakeMYC,
        shouldClaimEsMyc, // shouldClaimEsMyc,
        false, // shouldStakeEsMyc,
        false, // shouldStakeMultiplierPoints,
        shouldBuyMlpWithEth, // shouldClaimWeth,
        false, // shouldConvertWeth,
        shouldBuyMlpWithEth, // shouldBuyMlpWithEth
      ],
      {
        sentMsg: "Compound submitted!",
        failMsg: "Compound failed.",
        successMsg: "Compound completed!",
        setPendingTxns,
      }
    )
      .then(async (res) => {
        if (shouldClaimEsMyc) {
          await res.wait();
          depositEsMyc();
        } else {
          setIsVisible(false);
        }
      })
      .finally(() => {
        setIsCompounding(false);
      });
  };

  const depositEsMyc = async () => {
    setIsDepositing(true);
    const contract = new ethers.Contract(vesterAddress, Vester.abi, library.getSigner());
    const esMyc = new ethers.Contract(esMycAddress, Token.abi, library.getSigner());
    const balance = await esMyc.balanceOf(account);

    callContract(chainId, contract, "deposit", [balance], {
      sentMsg: "Deposit submitted!",
      failMsg: "Deposit failed!",
      successMsg: "Deposited!",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsDepositing(false);
      });
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label="Compound Rewards">
        <div className="CompoundModal-menu">
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>Claim Vested MYC</StakeV2Styled.ModalRowHeader>
            {shouldClaimMyc && (
              <>
                <StakeV2Styled.ModalRowText large inline>
                  {formatKeyAmount(processedData, "mlpVesterRewards", 18, 4)} MYC
                </StakeV2Styled.ModalRowText>{" "}
                <StakeV2Styled.ModalRowText inline secondary>
                  (${formatKeyAmount(processedData, "mlpVesterRewardsUsd", USD_DECIMALS, 4)})
                </StakeV2Styled.ModalRowText>
              </>
            )}
            <Toggle isChecked={shouldClaimMyc} handleToggle={setShouldClaimMyc} />
          </StakeV2Styled.ModalRow>
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>Claim and vest esMYC Rewards</StakeV2Styled.ModalRowHeader>
            {shouldClaimEsMyc && (
              <>
                <StakeV2Styled.ModalRowText inline large>
                  {formatKeyAmount(processedData, "stakedMlpTrackerRewards", 18, 4)} esMYC
                </StakeV2Styled.ModalRowText>{" "}
                <StakeV2Styled.ModalRowText inline secondary>
                  ($
                  {formatKeyAmount(processedData, "stakedMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                </StakeV2Styled.ModalRowText>
              </>
            )}
            <Toggle isChecked={shouldClaimEsMyc} handleToggle={setShouldClaimEsMyc} />
          </StakeV2Styled.ModalRow>
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>Buy MLP with {wrappedTokenSymbol} Rewards</StakeV2Styled.ModalRowHeader>
            {shouldBuyMlpWithEth && (
              <>
                <StakeV2Styled.ModalRowText large inline>
                  {formatKeyAmount(processedData, "feeMlpTrackerRewards", 18, 4)} {nativeTokenSymbol} (
                  {wrappedTokenSymbol})
                </StakeV2Styled.ModalRowText>{" "}
                <StakeV2Styled.ModalRowText inline secondary>
                  ($
                  {formatKeyAmount(processedData, "feeMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                </StakeV2Styled.ModalRowText>
              </>
            )}
            <Toggle isChecked={shouldBuyMlpWithEth} handleToggle={setShouldBuyMlpWithEth} />
          </StakeV2Styled.ModalRow>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function VesterDepositModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    maxAmount,
    value,
    setValue,
    balance,
    vestedAmount,
    maxVestableAmount,
    vesterAddress,
    setPendingTxns,
  } = props;
  const [isDepositing, setIsDepositing] = useState(false);
  const { library, account } = useWeb3React();

  const { data: ethBalance } = useSWR([library, "getBalance", account, "latest"], {
    fetcher: (library, method, ...params) => library[method](...params),
  });

  let amount = parseValue(value, 18);

  let nextDepositAmount = vestedAmount;
  if (amount) {
    nextDepositAmount = vestedAmount.add(amount);
  }

  const getError = () => {
    if (ethBalance?.eq(0)) {
      return ["Not enough ETH for gas"];
    }

    if (!amount || amount.eq(0)) {
      return "Enter an amount";
    }
    if (maxAmount && amount.gt(maxAmount)) {
      return "Max amount exceeded";
    }
  };

  const onClickPrimary = () => {
    setIsDepositing(true);
    const contract = new ethers.Contract(vesterAddress, Vester.abi, library.getSigner());

    callContract(chainId, contract, "deposit", [amount], {
      sentMsg: "Deposit submitted!",
      failMsg: "Deposit failed!",
      successMsg: "Deposited!",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsDepositing(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isDepositing) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isDepositing) {
      return "Depositing...";
    }
    return "Deposit";
  };

  return (
    <>
      <SEO
        title={getPageTitle("Earn")}
        description="Claim fees and liquidity mining rewards earned via providing liquidity to the Mycelium Perpetual Swap liquidity pool."
      />
      <div className="StakeModal">
        <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title} className="non-scrollable">
          <div className="Exchange-swap-section">
            <div className="Exchange-swap-section-top">
              <div className="muted">
                <div className="Exchange-swap-usd">Deposit</div>
              </div>
              <div
                className="muted align-right clickable"
                onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}
              >
                Max: {formatAmount(maxAmount, 18, 4, true)}
              </div>
            </div>
            <div className="Exchange-swap-section-bottom">
              <div>
                <input
                  type="number"
                  placeholder="0.0"
                  className="Exchange-swap-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div className="PositionEditor-token-symbol">esMYC</div>
            </div>
          </div>
          <div className="VesterDepositModal-info-rows">
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Wallet</div>
              <div className="align-right">{formatAmount(balance, 18, 2, true)} esMYC</div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Vault Capacity</div>
              <div className="align-right">
                <Tooltip
                  handle={`${formatAmount(nextDepositAmount, 18, 2, true)} / ${formatAmount(
                    maxVestableAmount,
                    18,
                    2,
                    true
                  )}`}
                  position="right-bottom"
                  renderContent={() => {
                    return (
                      <>
                        Vault Capacity for your Account
                        <br />
                        <br />
                        Deposited: {formatAmount(vestedAmount, 18, 2, true)} esMYC
                        <br />
                        Max Capacity: {formatAmount(maxVestableAmount, 18, 2, true)} esMYC
                        <br />
                      </>
                    );
                  }}
                />
              </div>
            </div>
          </div>
          <div className="Exchange-swap-button-container">
            <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
              {getPrimaryText()}
            </button>
          </div>
        </Modal>
      </div>
    </>
  );
}

function StakingModal(props) {
  const {
    active,
    stakeAction,
    isVisible,
    setIsVisible,
    chainId,
    mycBalance,
    esMycBalance,
    stakedMyc,
    stakedEsMyc,
    value,
    setValue,
    selectedToken,
    stakingAddress,
    setPendingTxns,
    isPaused,
  } = props;
  const [isApproving, setIsApproving] = useState(false);

  const [isTransacting, setIsTransacting] = useState(false);
  const { library, account } = useWeb3React();

  // Cannot update MYC and ES_MYC addresses in Addresses.js in case of breaking functions on testnet elsewhere
  const MYC_CONTRACT = {
    [ARBITRUM]: getContract(chainId, "MYC"),
    [ARBITRUM_GOERLI]: "0x46873E80daf930265B7E5419BBC266cC2880ff8c",
  };

  const ES_MYC_CONTRACT = {
    [ARBITRUM]: getContract(chainId, "ES_MYC"),
    [ARBITRUM_GOERLI]: "0x4897Dca24BcB50014456bcBBc59A2D6530FadCeB",
  };

  const STAKABLE_TOKENS = {
    [MYC_TOKEN]: { balance: mycBalance || ZERO_BN, staked: stakedMyc || ZERO_BN, contract: MYC_CONTRACT[chainId] },
    [ES_MYC_TOKEN]: {
      balance: esMycBalance || ZERO_BN,
      staked: stakedEsMyc || ZERO_BN,
      contract: ES_MYC_CONTRACT[chainId],
    },
  };

  const maxAmount = STAKABLE_TOKENS[selectedToken][stakeAction === STAKE ? "balance" : "staked"];

  const selectedTokenAddress = STAKABLE_TOKENS[selectedToken].contract;

  const { data: ethBalance } = useSWR([library, "getBalance", account, "latest"], {
    fetcher: (library, method, ...params) => library[method](...params),
  });

  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, selectedTokenAddress, "allowance", account, stakingAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const needApproval = tokenAllowance && tokenAllowance.eq(0);

  let amount = parseValue(value, 18);

  const getError = () => {
    if (ethBalance?.eq(0)) {
      return ["Not enough ETH for gas"];
    }

    if (STAKABLE_TOKENS[selectedToken].balance.eq(0)) {
      return `Insufficient ${selectedToken} balance`;
    }

    if (!amount || amount.eq(0)) {
      return "Enter an amount";
    }
    if (amount && amount.gt(maxAmount)) {
      return "Max amount exceeded";
    }
    if (isPaused) {
      return "Staking paused";
    }
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: selectedTokenAddress,
        spender: stakingAddress,
        chainId,
      });
      return;
    }
    setIsTransacting(true);
    const contract = new ethers.Contract(stakingAddress, RewardTracker.abi, library.getSigner());
    if (stakeAction === STAKE) {
      callContract(chainId, contract, "stake", [selectedTokenAddress, amount], {
        sentMsg: `Stake ${selectedToken} submitted!`,
        failMsg: `Staking ${selectedToken} failed!`,
        successMsg: `Staked!`,
        setPendingTxns,
      })
        .then(async (res) => {
          setIsVisible(false);
        })
        .finally(() => {
          setIsTransacting(false);
        });
    }
    if (stakeAction === UNSTAKE) {
      callContract(chainId, contract, "unstake", [selectedTokenAddress, amount], {
        sentMsg: `Unstake ${selectedToken} submitted!`,
        failMsg: `Unstaking ${selectedToken} failed!`,
        successMsg: `Unstaked!`,
        setPendingTxns,
      })
        .then(async (res) => {
          setIsVisible(false);
        })
        .finally(() => {
          setIsTransacting(false);
        });
    }
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isTransacting) {
      return false;
    }
    if (!isApproving) {
      return true;
    }
    if (!isPaused) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isApproving) {
      return `Approving ${selectedToken}...`;
    }
    if (needApproval) {
      return `Approve ${selectedToken}`;
    }
    if (isTransacting && stakeAction === STAKE) {
      return "Staking...";
    }
    if (isTransacting && stakeAction === UNSTAKE) {
      return "Unstaking...";
    }
    return stakeAction === STAKE ? `Stake ${selectedToken}` : `Unstake ${selectedToken}`;
  };

  return (
    <div className="StakeModal">
      <Modal
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        label={`${stakeAction} ${selectedToken}`}
        className="non-scrollable"
      >
        <div className="Exchange-swap-section">
          <div className="Exchange-swap-section-top">
            <div className="muted">
              <div className="Exchange-swap-usd">{stakeAction}</div>
            </div>
            <div className="muted align-right clickable" onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}>
              Max: {formatAmount(maxAmount, 18, 4, true)}
            </div>
          </div>
          <div className="Exchange-swap-section-bottom">
            <div>
              <input
                type="number"
                placeholder="0.0"
                className="Exchange-swap-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="PositionEditor-token-symbol">{selectedToken}</div>
          </div>
        </div>
        <div className="VesterDepositModal-info-rows">
          <div className="Exchange-info-row">
            <div className="Exchange-info-label">Currently Staking</div>
            <div className="align-right">
              <span>
                {formatAmount(STAKABLE_TOKENS[selectedToken].staked, 18, 4, true)} {selectedToken}
              </span>
            </div>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ClaimStakingRewardsModal(props) {
  const { isVisible, setIsVisible, chainId, rewardsEarned, value, setValue, setPendingTxns, stakingAddress } = props;

  const [isTransacting, setIsTransacting] = useState(false);
  const { library, account } = useWeb3React();

  const { data: ethBalance } = useSWR([library, "getBalance", account, "latest"], {
    fetcher: (library, method, ...params) => library[method](...params),
  });

  let amount = parseValue(value, 18);

  const maxAmount = rewardsEarned;

  const getError = () => {
    if (ethBalance?.eq(0)) {
      return ["Not enough ETH for gas"];
    }

    if (!amount || amount.eq(0)) {
      return "Enter an amount";
    }
    if (amount && amount.gt(maxAmount)) {
      return "Max amount exceeded";
    }
  };

  const onClickPrimary = () => {
    setIsTransacting(true);
    const contract = new ethers.Contract(stakingAddress, RewardTracker.abi, library.getSigner());

    callContract(chainId, contract, "claim", [account], {
      sentMsg: `Claim submitted!`,
      failMsg: `Claim failed!`,
      successMsg: `Claimed!`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsTransacting(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isTransacting) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isTransacting) {
      return "Claiming...";
    }
    return `Claim`;
  };

  return (
    <div className="StakeModal">
      <Modal
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        label="Claim Interest Rewards in WETH"
        className="non-scrollable"
      >
        <div className="Exchange-swap-section">
          <div className="Exchange-swap-section-top">
            <div className="muted">
              <div className="Exchange-swap-usd">Claim</div>
            </div>
            <div className="muted align-right clickable" onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}>
              Max: {formatAmount(maxAmount, 18, 4, true)}
            </div>
          </div>
          <div className="Exchange-swap-section-bottom">
            <div>
              <input
                type="number"
                placeholder="0.0"
                className="Exchange-swap-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="PositionEditor-token-symbol">WETH</div>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function VesterWithdrawModal(props) {
  const { isVisible, setIsVisible, chainId, title, library, vesterAddress, setPendingTxns } = props;
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const onClickPrimary = () => {
    setIsWithdrawing(true);
    const contract = new ethers.Contract(vesterAddress, Vester.abi, library.getSigner());

    callContract(chainId, contract, "withdraw", [], {
      sentMsg: "Withdraw submitted.",
      failMsg: "Withdraw failed.",
      successMsg: "Withdrawn!",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsWithdrawing(false);
      });
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div>
          This will withdraw and unreserve all tokens as well as pause vesting.
          <br />
          <br />
          esMYC tokens that have been converted to MYC will remain as MYC tokens.
          <br />
          <br />
          To claim MYC tokens without withdrawing, use the "Claim" button under the Total Rewards section.
          <br />
          <br />
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={isWithdrawing}>
            {!isWithdrawing && "Confirm Withdraw"}
            {isWithdrawing && "Confirming..."}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function StakeV2({
  setPendingTxns,
  connectWallet,
  trackAction,
  savedSlippageAmount,
  infoTokens,
  trackPageWithTraits,
  analytics,
}) {
  const { active, library, account } = useWeb3React();
  const { chainId } = useChainId();

  const chainName = getChainName(chainId);

  const [isVesterDepositModalVisible, setIsVesterDepositModalVisible] = useState(false);
  const [vesterDepositTitle, setVesterDepositTitle] = useState("");
  const [vesterDepositStakeTokenLabel, setVesterDepositStakeTokenLabel] = useState("");
  const [vesterDepositMaxAmount, setVesterDepositMaxAmount] = useState("");
  const [vesterDepositBalance, setVesterDepositBalance] = useState("");
  const [vesterDepositEscrowedBalance, setVesterDepositEscrowedBalance] = useState("");
  const [vesterDepositVestedAmount, setVesterDepositVestedAmount] = useState("");
  const [vesterDepositAverageStakedAmount, setVesterDepositAverageStakedAmount] = useState("");
  const [vesterDepositMaxVestableAmount, setVesterDepositMaxVestableAmount] = useState("");
  const [vesterDepositValue, setVesterDepositValue] = useState("");
  const [vesterDepositReserveAmount, setVesterDepositReserveAmount] = useState("");
  const [vesterDepositMaxReserveAmount, setVesterDepositMaxReserveAmount] = useState("");
  const [vesterDepositAddress, setVesterDepositAddress] = useState("");

  const [isStakingModalVisible, setIsStakingModalVisible] = useState(false);
  const [tokenToStake, setTokenToStake] = useState(MYC_TOKEN);
  const [amountToStake, setAmountToStake] = useState("");
  const [stakeAction, setStakeAction] = useState(STAKE);

  const [isClaimStakingRewardsModalVisible, setIsClaimStakingRewardsModalVisible] = useState(false);
  const [amountToClaim, setAmountToClaim] = useState("");

  const [isVesterWithdrawModalVisible, setIsVesterWithdrawModalVisible] = useState(false);
  const [vesterWithdrawTitle, setVesterWithdrawTitle] = useState(false);
  const [vesterWithdrawAddress, setVesterWithdrawAddress] = useState("");

  const [isCompoundModalVisible, setIsCompoundModalVisible] = useState(false);
  const [isClaimModalVisible, setIsClaimModalVisible] = useState(false);

  const rewardRouterAddress = getContract(chainId, "RewardRouter");
  const rewardReaderAddress = getContract(chainId, "RewardReader");
  const readerAddress = getContract(chainId, "Reader");

  const vaultAddress = getContract(chainId, "Vault");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const mycAddress = getContract(chainId, "MYC");
  const esMycAddress = getContract(chainId, "ES_MYC");
  const bnMycAddress = getContract(chainId, "BN_MYC");
  const mlpAddress = getContract(chainId, "MLP");

  const stakedMycTrackerAddress = getContract(chainId, "StakedMycTracker");
  const bonusMycTrackerAddress = getContract(chainId, "BonusMycTracker");
  const feeMycTrackerAddress = getContract(chainId, "FeeMycTracker");

  const stakedMlpTrackerAddress = getContract(chainId, "StakedMlpTracker");
  const feeMlpTrackerAddress = getContract(chainId, "FeeMlpTracker");

  const mlpManagerAddress = getContract(chainId, "MlpManager");

  const mycVesterAddress = getContract(chainId, "MycVester");
  const mlpVesterAddress = getContract(chainId, "MlpVester");

  const stakingAddress = getContract(chainId, "MYCStakingRewards");

  const vesterAddresses = [mycVesterAddress, mlpVesterAddress];

  const nativeTokenSymbol = getConstant(chainId, "nativeTokenSymbol");
  const wrappedTokenSymbol = getConstant(chainId, "wrappedTokenSymbol");

  const walletTokens = [mycAddress, esMycAddress, mlpAddress, stakedMycTrackerAddress];
  const depositTokens = [
    mycAddress,
    esMycAddress,
    stakedMycTrackerAddress,
    bonusMycTrackerAddress,
    bnMycAddress,
    mlpAddress,
  ];
  const rewardTrackersForDepositBalances = [
    stakedMycTrackerAddress,
    stakedMycTrackerAddress,
    bonusMycTrackerAddress,
    feeMycTrackerAddress,
    feeMycTrackerAddress,
    feeMlpTrackerAddress,
  ];
  const rewardTrackersForStakingInfo = [
    stakedMycTrackerAddress,
    bonusMycTrackerAddress,
    feeMycTrackerAddress,
    stakedMlpTrackerAddress,
    feeMlpTrackerAddress,
  ];

  const { data: walletBalances } = useSWR(
    [
      `StakeV2:walletBalances:${active}`,
      chainId,
      readerAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, ReaderV2, [walletTokens]),
    }
  );

  const { data: depositBalances } = useSWR(
    [
      `StakeV2:depositBalances:${active}`,
      chainId,
      rewardReaderAddress,
      "getDepositBalances",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, RewardReader, [depositTokens, rewardTrackersForDepositBalances]),
    }
  );

  const { data: stakingInfo } = useSWR(
    [`StakeV2:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  const { data: stakedMycSupply } = useSWR(
    [`StakeV2:stakedMycSupply:${active}`, chainId, mycAddress, "balanceOf", stakedMycTrackerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const { data: aums } = useSWR([`StakeV2:getAums:${active}`, chainId, mlpManagerAddress, "getAums"], {
    fetcher: fetcher(library, MlpManager),
  });

  const { data: nativeTokenPrice } = useSWR(
    [`StakeV2:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
    {
      fetcher: fetcher(library, Vault),
    }
  );

  const { data: vestingInfo } = useSWR(
    [`StakeV2:vestingInfo:${active}`, chainId, readerAddress, "getVestingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, ReaderV2, [vesterAddresses]),
    }
  );

  const { data: ethBalance } = useSWR([library, "getBalance", account, "latest"], {
    fetcher: (library, method, ...params) => library[method](...params),
  });

  const { mycPrice } = useMYCPrice(chainId, { arbitrum: chainId === ARBITRUM ? library : undefined }, active);

  const { total: mycSupply } = useTotalMYCSupply();

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  const { balanceData, supplyData } = getBalanceAndSupplyData(walletBalances);
  const depositBalanceData = getDepositBalanceData(depositBalances);
  const stakingData = getStakingData(stakingInfo);
  const vestingData = getVestingData(vestingInfo);

  const processedData = getProcessedData(
    balanceData,
    supplyData,
    depositBalanceData,
    stakingData,
    vestingData,
    aum,
    nativeTokenPrice,
    stakedMycSupply,
    mycPrice,
    mycSupply
  );

  const stakingApr = useStakingApr(mycPrice, nativeTokenPrice);
  // const tempAddress = "0xD9CF99Cf1E381703313F65DF16B17e0C1942EAe9";
  const {
    userMycBalance,
    userEsMycBalance,
    userStakedMycBalance,
    userStakedEsMycBalance,
    rewardsEarned,
    cumulativeRewards,
  } = useUserStakingBalances(account, chainId);
  const { isPaused, totalStaked, depositCap } = useStakingValues(chainId);

  let totalRewardTokens;
  if (processedData && processedData.bnMycInFeeMyc && processedData.bonusMycInFeeMyc) {
    totalRewardTokens = processedData.bnMycInFeeMyc.add(processedData.bonusMycInFeeMyc);
  }

  let totalRewardTokensAndMlp;
  if (totalRewardTokens && processedData && processedData.mlpBalance) {
    totalRewardTokensAndMlp = totalRewardTokens.add(processedData.mlpBalance);
  }

  let earnMsg;
  if (totalRewardTokensAndMlp && totalRewardTokensAndMlp.gt(0)) {
    earnMsg = (
      <div>
        You are earning {nativeTokenSymbol} rewards with{" "}
        {formatKeyAmount(processedData, "mlpBalance", MLP_DECIMALS, 2, true)} MLP tokens.
      </div>
    );
  }

  const showMlpCompoundModal = () => {
    if (ethBalance?.eq(0)) {
      helperToast.error("You don't have any ETH to pay for gas");
    } else {
      setIsCompoundModalVisible(true);
    }
  };

  const showMlpClaimModal = () => {
    if (ethBalance?.eq(0)) {
      helperToast.error("You don't have any ETH to pay for gas");
    } else {
      setIsClaimModalVisible(true);
    }
  };

  const showMycVesterDepositModal = () => {
    if (ethBalance?.eq(0)) {
      helperToast.error("You don't have any ETH to pay for gas");
      return;
    } else if (!vestingData) {
      helperToast.error("Loading vesting data, please wait.");
      return;
    }
    // let remainingVestableAmount = vestingData.mlpVester.maxVestableAmount.sub(vestingData.mlpVester.vestedAmount);
    // if (processedData.esMycBalance.lt(remainingVestableAmount)) {
    // }
    let remainingVestableAmount = processedData.esMycBalance;
    let maxVestableAmount = bigNumberify(remainingVestableAmount).add(vestingData.mlpVesterVestedAmount);

    setIsVesterDepositModalVisible(true);
    setVesterDepositTitle("esMYC Vault");
    setVesterDepositStakeTokenLabel("staked MYC + esMYC + Multiplier Points");
    setVesterDepositMaxAmount(remainingVestableAmount);
    setVesterDepositBalance(processedData.esMycBalance);
    setVesterDepositEscrowedBalance(vestingData.mlpVester.escrowedBalance);
    setVesterDepositVestedAmount(vestingData.mlpVester.vestedAmount);
    setVesterDepositMaxVestableAmount(maxVestableAmount);
    setVesterDepositAverageStakedAmount(vestingData.mlpVester.averageStakedAmount);
    setVesterDepositReserveAmount(vestingData.mlpVester.pairAmount);
    setVesterDepositMaxReserveAmount(totalRewardTokens);
    setVesterDepositValue("");
    setVesterDepositAddress(mlpVesterAddress);
  };

  const showMycVesterWithdrawModal = () => {
    if (ethBalance?.eq(0)) {
      helperToast.error("You don't have any ETH to pay for gas");
      return;
    } else if (!vestingData || !vestingData.mlpVesterVestedAmount || vestingData.mlpVesterVestedAmount.eq(0)) {
      helperToast.error("You have not deposited any tokens for vesting.");
      return;
    }

    setIsVesterWithdrawModalVisible(true);
    setVesterWithdrawTitle("Withdraw from esMYC Vault");
    setVesterWithdrawAddress(mlpVesterAddress);
  };

  const stakeToken = (token, action) => {
    setTokenToStake(token);
    setStakeAction(action);
    setIsStakingModalVisible(true);
  };

  const claimRewards = () => setIsClaimStakingRewardsModalVisible(true);

  return (
    <div className="StakeV2 Page page-layout default-container">
      <VesterDepositModal
        isVisible={isVesterDepositModalVisible}
        setIsVisible={setIsVesterDepositModalVisible}
        chainId={chainId}
        title={vesterDepositTitle}
        stakeTokenLabel={vesterDepositStakeTokenLabel}
        maxAmount={vesterDepositMaxAmount}
        balance={vesterDepositBalance}
        escrowedBalance={vesterDepositEscrowedBalance}
        vestedAmount={vesterDepositVestedAmount}
        averageStakedAmount={vesterDepositAverageStakedAmount}
        maxVestableAmount={vesterDepositMaxVestableAmount}
        reserveAmount={vesterDepositReserveAmount}
        maxReserveAmount={vesterDepositMaxReserveAmount}
        value={vesterDepositValue}
        setValue={setVesterDepositValue}
        vesterAddress={vesterDepositAddress}
        setPendingTxns={setPendingTxns}
      />
      <VesterWithdrawModal
        isVisible={isVesterWithdrawModalVisible}
        setIsVisible={setIsVesterWithdrawModalVisible}
        vesterAddress={vesterWithdrawAddress}
        chainId={chainId}
        title={vesterWithdrawTitle}
        library={library}
        setPendingTxns={setPendingTxns}
      />
      <CompoundModal
        active={active}
        account={account}
        setPendingTxns={setPendingTxns}
        isVisible={isCompoundModalVisible}
        setIsVisible={setIsCompoundModalVisible}
        rewardRouterAddress={rewardRouterAddress}
        totalVesterRewards={processedData.totalVesterRewards}
        wrappedTokenSymbol={wrappedTokenSymbol}
        nativeTokenSymbol={nativeTokenSymbol}
        library={library}
        chainId={chainId}
        processedData={processedData}
        vesterAddress={mlpVesterAddress}
        stakedMlpTrackerAddress={stakedMlpTrackerAddress}
        esMycAddress={esMycAddress}
      />
      <ClaimModal
        active={active}
        setPendingTxns={setPendingTxns}
        connectWallet={connectWallet}
        library={library}
        chainId={chainId}
        isVisible={isClaimModalVisible}
        setIsVisible={setIsClaimModalVisible}
        rewardRouterAddress={rewardRouterAddress}
        wrappedTokenSymbol={wrappedTokenSymbol}
        nativeTokenSymbol={nativeTokenSymbol}
        processedData={processedData}
      />
      <StakingModal
        stakeAction={stakeAction}
        active={active}
        isVisible={isStakingModalVisible}
        setIsVisible={setIsStakingModalVisible}
        chainId={chainId}
        stakeTokenLabel={vesterDepositStakeTokenLabel}
        mycBalance={userMycBalance}
        esMycBalance={userEsMycBalance}
        stakedMyc={userStakedMycBalance}
        stakedEsMyc={userStakedEsMycBalance}
        selectedToken={tokenToStake}
        value={amountToStake}
        setValue={setAmountToStake}
        stakingAddress={stakingAddress}
        setPendingTxns={setPendingTxns}
        isPaused={isPaused}
      />
      <ClaimStakingRewardsModal
        isVisible={isClaimStakingRewardsModalVisible}
        setIsVisible={setIsClaimStakingRewardsModalVisible}
        chainId={chainId}
        rewardsEarned={rewardsEarned}
        value={amountToClaim}
        setValue={setAmountToClaim}
        setPendingTxns={setPendingTxns}
        stakingAddress={stakingAddress}
      />

      <StakeV2Styled.StakeV2Content className="StakeV2-content">
        <StakeV2Styled.StakeV2Cards className="StakeV2-cards">
          <StakeV2Styled.StakeV2Card className="two-thirds">
            <div className="Page-title-section">
              <div className="Page-title">Earn</div>
              <div className="Page-description">
                Stake{" "}
                <a
                  href="https://swaps.docs.mycelium.xyz/protocol-design/mycelium-liquidity-pool-mlp/mlp-token"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MLP
                </a>{" "}
                to earn rewards.
                <br />
                Read the Terms of Use{" "}
                <a href="https://mycelium.xyz/rewards-terms-of-use" target="_blank" rel="noopener noreferrer">
                  here
                </a>
                .
              </div>
              {earnMsg && <div className="Page-description">{earnMsg}</div>}
            </div>
            <StakeV2Styled.Card>
              <StakeV2Styled.CardTitle className="App-card-title">
                <img src={mlp40Icon} alt="mlp40Icon" />
                MLP ({chainName})
              </StakeV2Styled.CardTitle>
              <MlpPriceChart chainId={chainId} mlpPrice={processedData.mlpPrice} />
              <StakeV2Styled.MlpInfo>
                <StakeV2Styled.RewardsBanner>
                  <StakeV2Styled.RewardsBannerRow>
                    <StakeV2Styled.RewardsBannerText large>Statistics</StakeV2Styled.RewardsBannerText>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerRow>
                    <div className="App-card-row">
                      <div className="label">Total APR</div>
                      <div>
                        <Tooltip
                          handle={`${formatKeyAmount(processedData, "mlpAprTotal", 2, 2, true)}%`}
                          position="right-bottom"
                          renderContent={() => {
                            return (
                              <>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    {nativeTokenSymbol} ({wrappedTokenSymbol}) APR
                                  </span>
                                  <span>{formatKeyAmount(processedData, "mlpAprForNativeToken", 2, 2, true)}%</span>
                                </div>
                                <div className="Tooltip-row">
                                  <span className="label">esMYC APR</span>
                                  <span>{formatKeyAmount(processedData, "mlpAprForEsMyc", 2, 2, true)}%</span>
                                </div>
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerRow>
                    <div className="App-card-row">
                      <div className="label">Price</div>
                      <StakeV2Styled.FlexColEnd>
                        <StakeV2Styled.Amount>
                          ${formatKeyAmount(processedData, "mlpPrice", USD_DECIMALS, 3, true)}
                        </StakeV2Styled.Amount>
                        <span>MLP</span>
                      </StakeV2Styled.FlexColEnd>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Wallet</div>
                      <StakeV2Styled.FlexColEnd>
                        <StakeV2Styled.Amount>
                          {formatKeyAmount(processedData, "mlpBalance", MLP_DECIMALS, 2, true)} MLP
                        </StakeV2Styled.Amount>
                        <StakeV2Styled.Subtitle>
                          ${formatKeyAmount(processedData, "mlpBalanceUsd", USD_DECIMALS, 2, true)} USD
                        </StakeV2Styled.Subtitle>
                      </StakeV2Styled.FlexColEnd>
                    </div>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerRow>
                    <div className="App-card-row">
                      <div className="label">Total Supply</div>
                      <div>
                        {formatKeyAmount(processedData, "mlpSupply", 18, 2, true)} MLP ($
                        {formatKeyAmount(processedData, "mlpSupplyUsd", USD_DECIMALS, 2, true)})
                      </div>
                    </div>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.Buttons>
                    <Link className="App-button-option App-card-option" to="/buy_mlp">
                      Buy MLP
                    </Link>
                    <Link className="App-button-option App-card-option" to="/buy_mlp#redeem">
                      Sell MLP
                    </Link>
                  </StakeV2Styled.Buttons>
                </StakeV2Styled.RewardsBanner>
                <StakeV2Styled.RewardsBanner>
                  <StakeV2Styled.RewardsBannerRow>
                    <StakeV2Styled.RewardsBannerText large>Rewards</StakeV2Styled.RewardsBannerText>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerRow>
                    <div className="App-card-row">
                      <div className="label">{nativeTokenSymbol} Rewards</div>
                      <div>
                        <StakeV2Styled.RewardsBannerTextWrap>
                          <StakeV2Styled.RewardsBannerText large>
                            {formatKeyAmount(processedData, "feeMlpTrackerRewards", 18, 4)} {nativeTokenSymbol}
                          </StakeV2Styled.RewardsBannerText>{" "}
                          <StakeV2Styled.RewardsBannerText secondary>
                            ($
                            {formatKeyAmount(processedData, "feeMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                          </StakeV2Styled.RewardsBannerText>
                        </StakeV2Styled.RewardsBannerTextWrap>
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">esMYC Rewards</div>
                      <StakeV2Styled.RewardsBannerTextWrap>
                        <StakeV2Styled.RewardsBannerText large>
                          {formatKeyAmount(processedData, "stakedMlpTrackerRewards", 18, 4)} esMYC
                        </StakeV2Styled.RewardsBannerText>{" "}
                        <StakeV2Styled.RewardsBannerText secondary>
                          ($
                          {formatKeyAmount(processedData, "stakedMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                        </StakeV2Styled.RewardsBannerText>
                      </StakeV2Styled.RewardsBannerTextWrap>
                    </div>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.FlexRowBetween>
                    {active && (
                      <StakeV2Styled.StakingButton whiteText onClick={() => showMlpClaimModal()} marginRight fullWidth>
                        Claim
                      </StakeV2Styled.StakingButton>
                    )}
                    {active && (
                      <StakeV2Styled.StakingButton whiteText onClick={() => showMlpClaimModal()} fullWidth>
                        Compound
                      </StakeV2Styled.StakingButton>
                    )}
                    {!active && (
                      <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                        Connect Wallet
                      </button>
                    )}
                  </StakeV2Styled.FlexRowBetween>
                </StakeV2Styled.RewardsBanner>
              </StakeV2Styled.MlpInfo>
            </StakeV2Styled.Card>
          </StakeV2Styled.StakeV2Card>
          <div>
            <StakeV2Styled.StakeV2Card>
              <div className="Page-title-section">
                <div className="Page-title">Stake MYC or esMYC</div>
                <div className="Page-description">
                  MYC and esMYC holders can stake their tokens and earn interest rewards. Read the terms and conditions{" "}
                  <a href="https://stake.mycelium.xyz/" target="_blank" rel="noopener noreferrer">
                    here (TBA)
                  </a>
                  .
                </div>
              </div>
              <StakeV2Styled.Card className="Staking">
                <StakeV2Styled.VestingInfo>
                  <StakeV2Styled.StakingBannerRow>
                    <div className="App-card-row break">
                      <div className="label">Wallet</div>
                      <div>
                        <StakeV2Styled.FlexRowEnd>
                          <WalletBalance
                            walletAmount={userMycBalance || ZERO_BN}
                            tokenUsdPrice={mycPrice || ZERO_BN}
                            selectedToken={CompatibleTokenEnum.MYC}
                          />
                          <StakeV2Styled.StakingButton onClick={() => stakeToken(MYC_TOKEN, STAKE)}>
                            Stake
                          </StakeV2Styled.StakingButton>
                        </StakeV2Styled.FlexRowEnd>
                        <StakeV2Styled.FlexRowEnd>
                          <WalletBalance
                            walletAmount={userEsMycBalance || ZERO_BN}
                            tokenUsdPrice={mycPrice || ZERO_BN}
                            selectedToken={CompatibleTokenEnum.esMYC}
                          />
                          <StakeV2Styled.StakingButton onClick={() => stakeToken(ES_MYC_TOKEN, STAKE)}>
                            Stake
                          </StakeV2Styled.StakingButton>
                        </StakeV2Styled.FlexRowEnd>
                      </div>
                    </div>
                    <StakeV2Styled.Divider />
                    <div className="App-card-row break">
                      <div className="label">Staked</div>
                      <div>
                        <StakeV2Styled.FlexRowEnd>
                          <WalletBalance
                            walletAmount={userStakedMycBalance || ZERO_BN}
                            tokenUsdPrice={mycPrice || ZERO_BN}
                            selectedToken={CompatibleTokenEnum.MYC}
                          />
                          <StakeV2Styled.StakingButton onClick={() => stakeToken(MYC_TOKEN, UNSTAKE)}>
                            Withdraw
                          </StakeV2Styled.StakingButton>
                        </StakeV2Styled.FlexRowEnd>
                        <StakeV2Styled.FlexRowEnd>
                          <WalletBalance
                            walletAmount={userStakedEsMycBalance || ZERO_BN}
                            tokenUsdPrice={mycPrice || ZERO_BN}
                            selectedToken={CompatibleTokenEnum.esMYC}
                          />
                          <StakeV2Styled.StakingButton onClick={() => stakeToken(ES_MYC_TOKEN, UNSTAKE)}>
                            Withdraw
                          </StakeV2Styled.StakingButton>
                        </StakeV2Styled.FlexRowEnd>
                      </div>
                    </div>
                  </StakeV2Styled.StakingBannerRow>
                  {stakingApr && (
                    <StakeV2Styled.StakingBannerRow>
                      <div className="App-card-row">
                        <div className="label">APR</div>
                        <div>
                          <b>{stakingApr}%</b>
                        </div>
                      </div>
                    </StakeV2Styled.StakingBannerRow>
                  )}
                  <StakeV2Styled.StakedTokens borderTop wrap>
                    <StakeV2Styled.FlexRowBetween>
                      <span>Claimable Rewards</span>
                      <StakeV2Styled.FlexRowEnd>
                        <WalletBalance
                          large
                          walletAmount={rewardsEarned || ZERO_BN}
                          tokenUsdPrice={nativeTokenPrice || ZERO_BN}
                          selectedToken={CompatibleTokenEnum.WETH}
                          decimals={6}
                        />
                      </StakeV2Styled.FlexRowEnd>
                    </StakeV2Styled.FlexRowBetween>
                    <StakeV2Styled.ClaimButtonContainer>
                      <StakeV2Styled.StakingButton onClick={claimRewards} fullWidth whiteText>
                        Claim Rewards Now
                      </StakeV2Styled.StakingButton>
                    </StakeV2Styled.ClaimButtonContainer>
                  </StakeV2Styled.StakedTokens>
                  {cumulativeRewards && (
                    <StakeV2Styled.StakingBannerRow>
                      <div className="App-card-row break">
                        <div className="label">Total Rewards</div>
                        <div>
                          <span>
                            <b>{parseBigNumberToString(cumulativeRewards, 6)} WETH</b>
                          </span>
                          <StakeV2Styled.Subtitle>
                            {" "}
                            $
                            {formatNumberWithCommas(
                              parseFloat(
                                parseBigNumberToString(
                                  nativeTokenPrice.mul(cumulativeRewards).div(expandDecimals(1, USD_PRICE_PRECISION)),
                                  2
                                )
                              )
                            )}
                          </StakeV2Styled.Subtitle>
                        </div>
                      </div>
                    </StakeV2Styled.StakingBannerRow>
                  )}
                  <StakeV2Styled.StakingBannerRow>
                    <StakeV2Styled.FlexRowBetween>
                      <StakeV2Styled.Subtitle white>Total Staked (MYC & esMYC)</StakeV2Styled.Subtitle>
                      <StakeV2Styled.Subtitle white>Vault Capacity</StakeV2Styled.Subtitle>
                    </StakeV2Styled.FlexRowBetween>
                    <StakeV2Styled.VaultCapacityBackdrop>
                      {totalStaked && depositCap && (
                        <StakeV2Styled.VaultCapacityBar width={(totalStaked / depositCap) * 100} />
                      )}
                    </StakeV2Styled.VaultCapacityBackdrop>
                    <StakeV2Styled.FlexRowBetween>
                      {totalStaked && mycPrice && (
                        <StakeV2Styled.FlexRowCol>
                          <span>
                            <b>{formatNumberWithCommas(parseFloat(ethers.utils.formatUnits(totalStaked)), 0)}</b>
                          </span>
                          <StakeV2Styled.Subtitle>
                            $
                            {formatNumberWithCommas(
                              parseFloat(
                                ethers.utils.formatUnits(
                                  mycPrice.mul(totalStaked).div(expandDecimals(1, USD_PRICE_PRECISION))
                                )
                              ),
                              2
                            )}
                          </StakeV2Styled.Subtitle>
                        </StakeV2Styled.FlexRowCol>
                      )}
                      {depositCap && mycPrice && (
                        <StakeV2Styled.FlexColEnd>
                          <span>
                            <b>{formatNumberWithCommas(parseFloat(ethers.utils.formatUnits(depositCap)), 0)}</b>
                          </span>
                          <StakeV2Styled.Subtitle>
                            $
                            {formatNumberWithCommas(
                              parseFloat(
                                ethers.utils.formatUnits(
                                  mycPrice.mul(depositCap).div(expandDecimals(1, USD_PRICE_PRECISION))
                                )
                              ),
                              2
                            )}
                          </StakeV2Styled.Subtitle>
                        </StakeV2Styled.FlexColEnd>
                      )}
                    </StakeV2Styled.FlexRowBetween>
                    <StakeV2Styled.Divider />
                    <StakeV2Styled.FlexRowBetweenCenter noMargin>
                      <StakeV2Styled.FlexRow>
                        Buy <TokenIcon token="MYC" size="lg" />
                        MYC
                      </StakeV2Styled.FlexRow>
                      <StakeV2Styled.OutgoingLink href="https://app.1inch.io/#/42161/unified/swap/USDC/0xc74fe4c715510ec2f8c61d70d397b32043f55abe">
                        <StakeV2Styled.StakingButton fullWidth>Buy on 1inch</StakeV2Styled.StakingButton>
                      </StakeV2Styled.OutgoingLink>
                    </StakeV2Styled.FlexRowBetweenCenter>
                  </StakeV2Styled.StakingBannerRow>
                </StakeV2Styled.VestingInfo>
              </StakeV2Styled.Card>
            </StakeV2Styled.StakeV2Card>
            <StakeV2Styled.StakeV2Card>
              <div className="Page-title-section">
                <div className="Page-title">Vest</div>
                <div className="Page-description">
                  Convert esMYC tokens to MYC tokens.
                  <br />
                  Please read the{" "}
                  <a
                    href="https://swaps.docs.mycelium.xyz/protocol-design/mycelium-liquidity-pool-mlp/mlp-rewards/esmyc-escrowed-myc"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    vesting details
                  </a>{" "}
                  before using the vaults.
                </div>
              </div>
              <StakeV2Styled.Card>
                <StakeV2Styled.CardTitle className="App-card-title">
                  <img src={myc40Icon} alt="myc40Icon" />
                  esMYC Vault
                </StakeV2Styled.CardTitle>
                <StakeV2Styled.VestingInfo>
                  <StakeV2Styled.StakedTokens>
                    <StakeV2Styled.RewardsBannerText secondary>Vesting Tokens</StakeV2Styled.RewardsBannerText>
                    <div>
                      <StakeV2Styled.RewardsBannerTextWrap>
                        <StakeV2Styled.RewardsBannerText inline>
                          {formatKeyAmount(vestingData, "mlpVesterVestedAmount", 18, 4, true)} esMYC
                        </StakeV2Styled.RewardsBannerText>{" "}
                        <StakeV2Styled.RewardsBannerText inline>
                          ($
                          {formatKeyAmount(processedData, "mlpVesterVestedAmountUsd", USD_DECIMALS, 2, true)})
                        </StakeV2Styled.RewardsBannerText>
                      </StakeV2Styled.RewardsBannerTextWrap>
                    </div>
                  </StakeV2Styled.StakedTokens>
                  <StakeV2Styled.StakingBannerRow>
                    <div className="App-card-row">
                      <div className="label">Vesting Status</div>
                      <div>
                        <Tooltip
                          handle={`${formatKeyAmount(
                            vestingData,
                            "mlpVesterClaimSum",
                            18,
                            4,
                            true
                          )} / ${formatKeyAmount(vestingData, "mlpVesterVestedAmount", 18, 4, true)}`}
                          position="right-bottom"
                          renderContent={() => {
                            return (
                              <>
                                {formatKeyAmount(vestingData, "mlpVesterClaimSum", 18, 4, true)} tokens have been
                                converted to MYC from the&nbsp;
                                {formatKeyAmount(vestingData, "mlpVesterVestedAmount", 18, 4, true)} esMYC deposited for
                                vesting.
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Claimable</div>
                      <div>
                        <Tooltip
                          handle={`${formatKeyAmount(vestingData, "mlpVesterClaimable", 18, 4, true)} MYC`}
                          position="right-bottom"
                          renderContent={() =>
                            `${formatKeyAmount(
                              vestingData,
                              "mlpVesterClaimable",
                              18,
                              4,
                              true
                            )} MYC tokens can be claimed, use the options under the Earn section to claim them.`
                          }
                        />
                      </div>
                    </div>
                    <StakeV2Styled.Buttons>
                      {!active && (
                        <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                          Connect Wallet
                        </button>
                      )}
                      {active && (
                        <button
                          className="App-button-option App-card-option"
                          onClick={() => showMycVesterDepositModal()}
                        >
                          Deposit
                        </button>
                      )}
                      {active && (
                        <button
                          className="App-button-option App-card-option"
                          onClick={() => showMycVesterWithdrawModal()}
                        >
                          Withdraw
                        </button>
                      )}
                    </StakeV2Styled.Buttons>
                  </StakeV2Styled.StakingBannerRow>
                </StakeV2Styled.VestingInfo>
              </StakeV2Styled.Card>
            </StakeV2Styled.StakeV2Card>
          </div>
        </StakeV2Styled.StakeV2Cards>
      </StakeV2Styled.StakeV2Content>
    </div>
  );
}
