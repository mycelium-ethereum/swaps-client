import React, { useState, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";

import useSWR from "swr";
import { ethers } from "ethers";

import { getToken, getWhitelistedTokens } from "../../data/Tokens";
import { getContract } from "../../Addresses";
import {
  useLocalStorageByChainId,
  useLocalStorageSerializeKey,
  getTokenInfo,
  expandDecimals,
  fetcher,
  bigNumberify,
  formatAmount,
  formatAmountFree,
  getSellMlpToAmount,
  parseValue,
  getUsd,
  adjustForDecimals,
  getUserTokenBalances,
  getAnalyticsEventStage,
  NETWORK_NAME,
  MLP_DECIMALS,
  USD_DECIMALS,
  BASIS_POINTS_DIVISOR,
  MLP_COOLDOWN_DURATION,
  USDG_DECIMALS,
  PLACEHOLDER_ACCOUNT,
  formatKeyAmount,
  ETH_DECIMALS,
} from "../../Helpers";


import { callContract } from "../../Api";

import ReaderV2 from "../../abis/ReaderV2.json";
import VaultV2 from "../../abis/VaultV2.json";
import MlpManager from "../../abis/MlpManager.json";
import RewardTracker from "../../abis/RewardTracker.json";
import Vester from "../../abis/Vester.json";
import RewardRouter from "../../abis/RewardRouter.json";

import tlp24Icon from "../../img/ic_mlp_24.svg";
import arrowIcon from "../../img/ic_convert_down.svg";

import './ClaimModal.css';
import * as StakeV2Styled from "./StakeV2Styles";
import BuyInputSection from "../../components/BuyInputSection/BuyInputSection";
import TokenSelector from "../../components/Exchange/TokenSelector";
import Toggle from "../../components/Toggle/Toggle";
import Modal from "../../components/Modal/Modal";

const { AddressZero } = ethers.constants;
export default function ClaimModal(props) {
  const {
    active,
    account,
    setPendingTxns,
    savedSlippageAmount,
    connectWallet,
    infoTokens,
    trackAction,
    trackPageWithTraits,
    analytics,
    library,
    chainId,
    isVisible,
    setIsVisible,
    nativeTokenSymbol,
    wrappedTokenSymbol,
    processedData,
    userSpreadCapture,
    userSpreadCaptureEth,
  } = props;

  const [isClaiming, setIsClaiming] = useState(false);

  const [shouldClaimMyc, setShouldClaimMyc] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-myc"],
    true
  );

  const [shouldClaimEsMyc, setShouldClaimEsMyc] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-esMyc"],
    true
  );

  const [shouldClaimWeth, setShouldClaimWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-weth"],
    true
  );
  const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-convert-weth"],
    true
  );
  const [shouldClaimSpreadCapture, setShouldClaimSpreadCapture] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-spread-capture"],
    true
  );

  // used since there is some delay in the graph updating
  const [hasRecentlyClaimed, setHasRecentlyClaimed] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-has-recently-claimed-spread-capture"],
    true
  );

  const history = useHistory();
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const [swapValue, setSwapValue] = useState("");
  const [mlpValue, setMlpValue] = useState("");
  const [swapTokenAddress, setSwapTokenAddress] = useLocalStorageByChainId(
    chainId,
    `WithdrawSpreadCapture-swap-token-address`,
    AddressZero
  );
  // Clear cache of deprecated token address
  if (swapTokenAddress === "0x6467A2ad44C49dB9788d60e82B3adE35CcA5c5C4") {
    setSwapTokenAddress(AddressZero);
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeBasisPoints, setFeeBasisPoints] = useState("");

  const readerAddress = getContract(chainId, "Reader");
  const vaultAddress = getContract(chainId, "Vault");
  const stakedMlpTrackerAddress = getContract(chainId, "StakedMlpTracker");
  const feeMlpTrackerAddress = getContract(chainId, "FeeMlpTracker");
  const usdgAddress = getContract(chainId, "USDG");
  const mlpManagerAddress = getContract(chainId, "MlpManager");
  const rewardRouterAddress = getContract(chainId, "RewardRouter");
  const tokensForBalanceAndSupplyQuery = [stakedMlpTrackerAddress, usdgAddress];

  const { data: balancesAndSupplies } = useSWR(
    [
      `MlpSwap:getTokenBalancesWithSupplies:${active}`,
      chainId,
      readerAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, ReaderV2, [tokensForBalanceAndSupplyQuery]),
    }
  );

  const { data: aums } = useSWR([`MlpSwap:getAums:${active}`, chainId, mlpManagerAddress, "getAums"], {
    fetcher: fetcher(library, MlpManager),
  });

  const { data: totalTokenWeights } = useSWR(
    [`MlpSwap:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
    {
      fetcher: fetcher(library, VaultV2),
    }
  );

  const { data: lastPurchaseTime } = useSWR(
    [`MlpSwap:lastPurchaseTime:${active}`, chainId, mlpManagerAddress, "lastAddedAt", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, MlpManager),
    }
  );

  const { data: mlpBalance } = useSWR(
    [`MlpSwap:mlpBalance:${active}`, chainId, feeMlpTrackerAddress, "stakedAmounts", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, RewardTracker),
    }
  );

  const mlpVesterAddress = getContract(chainId, "MlpVester");
  const { data: reservedAmount } = useSWR(
    [`MlpSwap:reservedAmount:${active}`, chainId, mlpVesterAddress, "pairAmounts", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, Vester),
    }
  );

  // if claimed in the last 5 minutes then zero out rewards
  const shouldZeroSpreadCapture = useMemo(() => Number(hasRecentlyClaimed) + (60 * 5 * 1000) > Date.now(), [hasRecentlyClaimed])

  const redemptionTime = lastPurchaseTime ? lastPurchaseTime.add(MLP_COOLDOWN_DURATION) : undefined;
  const inCooldownWindow = redemptionTime && parseInt(Date.now() / 1000) < redemptionTime;

  const mlpSupply = balancesAndSupplies ? balancesAndSupplies[1] : bigNumberify(0);
  const usdgSupply = balancesAndSupplies ? balancesAndSupplies[3] : bigNumberify(0);
  let aum;
  if (aums && aums.length > 0) {
    aum = aums[1];
  }
  const mlpPrice =
    aum && aum.gt(0) && mlpSupply.gt(0)
      ? aum.mul(expandDecimals(1, MLP_DECIMALS)).div(mlpSupply)
      : expandDecimals(1, USD_DECIMALS);

  useEffect(() => {
    if (shouldZeroSpreadCapture) {
      setMlpValue('0')
    } else if (userSpreadCapture && mlpPrice) {
      let mlpAmount = userSpreadCapture.mul(expandDecimals(1, MLP_DECIMALS)).div(mlpPrice)
      setMlpValue(formatAmount(mlpAmount, MLP_DECIMALS))
    }
  }, [userSpreadCapture, mlpPrice, shouldZeroSpreadCapture])

  const swapToken = getToken(chainId, swapTokenAddress);
  const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);

  const swapTokenBalance = swapTokenInfo && swapTokenInfo.balance ? swapTokenInfo.balance : bigNumberify(0);

  const swapAmount = parseValue(swapValue, swapToken && swapToken.decimals);
  const mlpAmount = parseValue(mlpValue, MLP_DECIMALS);

  const swapUsdMin = getUsd(swapAmount, swapTokenAddress, false, infoTokens);
  const mlpUsdMax = mlpAmount && mlpPrice ? mlpAmount.mul(mlpPrice).div(expandDecimals(1, MLP_DECIMALS)) : undefined;

  let isSwapTokenCapReached;
  if (swapTokenInfo.managedUsd && swapTokenInfo.maxUsdgAmount) {
    isSwapTokenCapReached = swapTokenInfo.managedUsd.gt(
      adjustForDecimals(swapTokenInfo.maxUsdgAmount, USDG_DECIMALS, USD_DECIMALS)
    );
  }

  const onSelectSwapToken = (token) => {
    setSwapTokenAddress(token.address);
  };

  useEffect(() => {
    const updateSwapAmounts = () => {
      if (!mlpAmount) {
        setSwapValue("");
        setFeeBasisPoints("");
        return;
      }

      if (swapToken) {
        const { amount: nextAmount, feeBasisPoints: feeBps } = getSellMlpToAmount(
          mlpAmount,
          swapTokenAddress,
          infoTokens,
          mlpPrice,
          usdgSupply,
          totalTokenWeights,
          true
        );
        const nextValue = formatAmountFree(nextAmount, swapToken.decimals, swapToken.decimals);
        setSwapValue(nextValue);
        setFeeBasisPoints(feeBps);
      }
    };

    updateSwapAmounts();
  }, [
    swapAmount,
    mlpAmount,
    swapToken,
    swapTokenAddress,
    infoTokens,
    mlpPrice,
    usdgSupply,
    totalTokenWeights,
  ]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getError = () => {
    if (shouldClaimSpreadCapture) {
      const gasTokenInfo = getTokenInfo(infoTokens, ethers.constants.AddressZero);
      if (gasTokenInfo.balance?.eq(0)){
        return ["Not enough ETH for gas"];
      }

      if (inCooldownWindow) {
        return [`Redemption time not yet reached`];
      }

      if (!swapAmount || swapAmount.eq(0)) {
        return ["No market making rewards"];
      }
      if (!mlpAmount || mlpAmount.eq(0)) {
        return ["No market making rewards"];
      }

      if (maxSellAmount && mlpAmount && mlpAmount.gt(maxSellAmount)) {
        return [`Insufficient MLP balance`];
      }

      const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
      if (
        swapTokenInfo &&
        swapTokenInfo.availableAmount &&
        swapAmount &&
        swapAmount.gt(swapTokenInfo.availableAmount)
      ) {
        return [`Insufficient liquidity`];
      }
    }

    return [false];
  };

  const sellMlp = async () => {
    setIsSubmitting(true);

    const minOut = swapAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    const method = swapTokenAddress === AddressZero ? "unstakeAndRedeemMlpETH" : "unstakeAndRedeemMlp";
    const params =
      swapTokenAddress === AddressZero ? [mlpAmount, minOut, account] : [swapTokenAddress, mlpAmount, minOut, account];


    return callContract(chainId, contract, method, params, {
      sentMsg: "Sell submitted!",
      failMsg: "Sell failed.",
      successMsg: `${formatAmount(mlpAmount, 18, 4, true)} MLP sold for ${formatAmount(
        swapAmount,
        swapTokenInfo.decimals,
        4,
        true
      )} ${swapTokenInfo.symbol}!`,
      setPendingTxns,
    })
      .then(async () => {
        trackMlpTrade(3, "Sell MLP");
        setHasRecentlyClaimed(Date.now())
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  let payBalance = "$0.00";
  let receiveBalance = "$0.00";
  if (mlpUsdMax) {
    payBalance = `$${formatAmount(mlpUsdMax, USD_DECIMALS, 2, true)}`;
  }
  if (swapUsdMin) {
    receiveBalance = `$${formatAmount(swapUsdMin, USD_DECIMALS, 2, true)}`;
  }

  let maxSellAmount = mlpBalance;
  if (mlpBalance && reservedAmount) {
    maxSellAmount = mlpBalance.sub(reservedAmount);
  }

  const trackMlpTrade = (stage, tradeType) => {
    const eventName = getAnalyticsEventStage(stage);

    const isBuy = tradeType.includes("Buy");
    try {
      const feePercentage = formatAmount(feeBasisPoints, 2, 2, false, "-");
      const feesUsd = (parseFloat(payBalance.replace("$", "")) * parseFloat(feePercentage)) / 100;
      const feesEth = (swapValue * parseFloat(feePercentage)) / 100;
      const amountToPay = isBuy ? swapValue : mlpValue;
      const amountToReceive = isBuy ? mlpValue : swapValue;
      const amountToReceiveUsd = receiveBalance?.replace("$", "");
      const tokenToPay = isBuy ? swapTokenInfo.symbol : "MLP";
      const tokenToReceive = isBuy ? "MLP" : swapTokenInfo.symbol;

      const [userBalances, tokenPrices, poolBalances] = getUserTokenBalances(infoTokens);

      const traits = {
        actionType: "Create",
        transactionType: isBuy ? "Buy" : "Sell",
        amountToReceiveUsd: parseFloat(amountToReceiveUsd),
        tradeType: tradeType,
        tokenToPay: tokenToPay,
        tokenToReceive: tokenToReceive,
        amountToPay: parseFloat(amountToPay),
        amountToReceive: parseFloat(amountToReceive),
        balance: parseFloat(formatAmount(swapTokenBalance, swapToken.decimals, 4, false)),
        balanceToken: swapToken.symbol,
        feesUsd: feesUsd.toFixed(2),
        feesEth: parseFloat(feesEth).toFixed(8),
        walletAddress: account,
        network: NETWORK_NAME[chainId],
        ...userBalances,
        ...tokenPrices,
        ...poolBalances,
      };
      trackAction && trackAction(eventName, traits);
    } catch (err) {
      console.error(`Unable to track ${eventName} event`, err);
    }
  };

  const [pageTracked, setPageTracked] = useState(false);

  const dataElements = [chainId, pageTracked, swapTokenAddress, history.location.hash];
  const elementsLoaded = dataElements.every((element) => element !== undefined);

  // Segment Analytics Page tracking
  useEffect(() => {
    if (elementsLoaded && analytics && !pageTracked) {
      const tokenToPay = "MLP"
      const tokenToReceive = getToken(chainId, swapTokenAddress).symbol;
      const traits = {
        action: "Withdraw Spread Capture",
        tokenToPay: tokenToPay,
        tokenToReceive: tokenToReceive,
      };
      trackPageWithTraits(traits);
      setPageTracked(true); // Prevent Page function being called twice
    }
  }, [
    chainId,
    pageTracked,
    swapTokenAddress,
    elementsLoaded,
    trackPageWithTraits,
    history.location.hash,
    analytics,
  ]);


  const isPrimaryEnabled = () => {
    if (!active) {
      return true;
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return false;
    }
    if (isClaiming) {
      return false;
    }
    if (isSubmitting) {
      return false;
    }
    if (isSwapTokenCapReached) {
      return false;
    }

    return true;
  };

  const getPrimaryText = () => {
    if (!active) {
      return "Connect Wallet";
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return error;
    }
    if (isClaiming) {
      return 'Claiming...'
    } else if (isSubmitting) {
      return "Selling MLP...";
    }

    return "Claim";
  };

  const onClickPrimary = async () => {
    if (!active) {
      connectWallet();
      return;
    }

    const [, modal] = getError();

    if (modal) {
      return;
    }

    await claimRewards();

    if (shouldClaimSpreadCapture) {
      await sellMlp();
    }

    setIsVisible(false)
    ;
  };

  const claimRewards = async () => {
    setIsClaiming(true);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    return callContract(
      chainId,
      contract,
      "handleRewards",
      [
        shouldClaimMyc, // shouldClaimMYC,
        false, // shouldStakeMYC
        shouldClaimEsMyc, // shouldClaimEsMyc,
        false, // shouldStakeEsMyc
        false, // shouldStakeMultiplierPoints
        shouldClaimWeth,
        shouldConvertWeth,
        false, // shouldBuyTlpWithEth
      ],
      {
        sentMsg: "Claim submitted.",
        failMsg: "Claim failed.",
        successMsg: "Claim completed!",
        setPendingTxns,
      }
    )
      .then(async (res) => {
        // setIsVisible(false);
      })
      .finally(() => {
        setIsClaiming(false);
      });
  };

  const toggleConvertWeth = (value) => {
    if (value) {
      setShouldClaimWeth(true);
    }
    setShouldConvertWeth(value);
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label="Claim Rewards">
        <div className="CompoundModal-menu">
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>
              Claim MYC Rewards
            </StakeV2Styled.ModalRowHeader>
            {shouldClaimMyc &&
              <>
                <StakeV2Styled.ModalRowText large inline>
                  {formatKeyAmount(processedData, "mlpVesterRewards", 18, 4, true)} MYC
                </StakeV2Styled.ModalRowText>{" "}
                <StakeV2Styled.ModalRowText inline secondary>
                  (${formatKeyAmount(processedData, "mlpVesterRewardsUsd", USD_DECIMALS, 4, true)})
                </StakeV2Styled.ModalRowText>
              </>
            }
            <Toggle isChecked={shouldClaimMyc} handleToggle={setShouldClaimMyc} />
          </StakeV2Styled.ModalRow>
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>
              Claim esMYC Rewards
            </StakeV2Styled.ModalRowHeader>
            {shouldClaimEsMyc &&
              <>
                <StakeV2Styled.ModalRowText inline large>
                  {formatKeyAmount(processedData, "stakedMlpTrackerRewards", 18, 4)} esMYC
                </StakeV2Styled.ModalRowText>{" "}
                <StakeV2Styled.ModalRowText inline secondary>
                  ($
                  {formatKeyAmount(processedData, "stakedMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                </StakeV2Styled.ModalRowText>
              </>
            }
            <Toggle isChecked={shouldClaimEsMyc} handleToggle={setShouldClaimEsMyc} />
          </StakeV2Styled.ModalRow>
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>
              Claim {wrappedTokenSymbol} Rewards
            </StakeV2Styled.ModalRowHeader>
            {shouldClaimWeth && 
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
            }
            <Toggle isChecked={shouldClaimWeth} handleToggle={setShouldClaimWeth} disabled={shouldConvertWeth} />
          </StakeV2Styled.ModalRow>
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>
              Convert {wrappedTokenSymbol} to {nativeTokenSymbol}
            </StakeV2Styled.ModalRowHeader>
            <Toggle isChecked={shouldConvertWeth} handleToggle={toggleConvertWeth} />
          </StakeV2Styled.ModalRow>
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>
              Market Making Rewards
            </StakeV2Styled.ModalRowHeader>
            {shouldClaimSpreadCapture  &&
              <>
                <StakeV2Styled.ModalRowText large inline>
                  {shouldZeroSpreadCapture ? '0.00' : formatAmount(userSpreadCaptureEth, ETH_DECIMALS, 5, true, '0.00')} (
                  {wrappedTokenSymbol})
                </StakeV2Styled.ModalRowText>{" "}
                <StakeV2Styled.ModalRowText inline secondary>
                  ($
                  {shouldZeroSpreadCapture ? '0.00' : formatAmount(userSpreadCapture, USD_DECIMALS, 2, true, '0.00')})
                </StakeV2Styled.ModalRowText>

                <div className="Spread-capture">
                  <div className="Spread-capture-description">
                    Market Making Rewards are realised in the capital apprecitaion
                    of your MLP position. Sell a portion of your MLP position to
                    claim your Market Making Rewards.
                  </div>
                  <BuyInputSection
                    topLeftLabel={'Sell'}
                    staticInput={true}
                    inputValue={mlpValue}
                    balance={payBalance}
                    defaultTokenName={"MLP"}
                  >
                    <div className="selected-token">
                      MLP <img src={tlp24Icon} alt="tlp24Icon" />
                    </div>
                  </BuyInputSection>

                  <div className="AppOrder-ball-container">
                    <div className="AppOrder-ball">
                      <img
                        src={arrowIcon}
                        alt="arrowIcon"
                      />
                    </div>
                  </div>
                  <BuyInputSection
                    topLeftLabel={"Receive"}
                    staticInput={true}
                    inputValue={swapValue}
                    balance={receiveBalance}
                    selectedToken={swapToken}
                    trackAction={trackAction}
                  >
                    <TokenSelector
                      label="Receive"
                      chainId={chainId}
                      tokenAddress={swapTokenAddress}
                      onSelectToken={onSelectSwapToken}
                      tokens={whitelistedTokens}
                      infoTokens={infoTokens}
                      className="MlpSwap-from-token"
                      showSymbolImage={true}
                      showTokenImgInDropdown={true}
                      trackAction={trackAction}
                    />
                  </BuyInputSection>
                </div>
              </>
            }
            <Toggle isChecked={shouldClaimSpreadCapture} handleToggle={setShouldClaimSpreadCapture} />
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
