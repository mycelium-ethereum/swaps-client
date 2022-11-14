import React, { useState } from "react";

import { ethers } from "ethers";

import {
  useLocalStorageSerializeKey,
  USD_DECIMALS,
  formatKeyAmount,
} from "../../Helpers";

import { callContract } from "../../Api";

import RewardRouter from "../../abis/RewardRouter.json";

import * as StakeV2Styled from "./StakeV2Styles";
import Toggle from "../../components/Toggle/Toggle";
import Modal from "../../components/Modal/Modal";

export default function ClaimModal(props) {
  const {
    active,
    setPendingTxns,
    connectWallet,
    library,
    chainId,
    isVisible,
    setIsVisible,
    nativeTokenSymbol,
    wrappedTokenSymbol,
    processedData,
    rewardRouterAddress,
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

  const getError = () => {
    return [false];
  };

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
        false, // shouldBuyMlpWithEth
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
    <StakeV2Styled.ClaimModal className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label="Claim Rewards">
        <div className="CompoundModal-menu">
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>
              Claim Vested MYC 
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
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </StakeV2Styled.ClaimModal>
  );
}
