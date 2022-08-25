import React, { useEffect, useState } from "react";
import { bigNumberify, getCodeError, helperToast, useDebounce } from "../../Helpers";
import { getReferralCodeTakenStatus } from '../../Api';
import * as Styles from "./Referrals.styles";
import Checkbox from "../../components/Checkbox/Checkbox";

const getSampleReferrarStat = (code) => {
  return {
    discountUsd: bigNumberify(0),
    referralCode: code,
    totalRebateUsd: bigNumberify(0),
    tradedReferralsCount: 0,
    registeredReferralsCount: 0,
    trades: 0,
    volume: bigNumberify(0),
    time: Date.now(),
  };
};

export default function CreateCodeModal(props) {
  const {
    account,
    chainId,
    active,
    isCreateCodeModalVisible,
    setIsCreateCodeModalVisible,
    handleCreateReferralCode,
    recentlyAddedCodes,
    setRecentlyAddedCodes,
    connectWallet
  } = props;

  const [referralCode, setReferralCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const [referralCodeCheckStatus, setReferralCodeCheckStatus] = useState("ok");
  const debouncedReferralCode = useDebounce(referralCode, 300);

  useEffect(() => {
    let cancelled = false;
    const checkCodeTakenStatus = async () => {
      if (error || error.length > 0) {
        setReferralCodeCheckStatus("ok");
        return;
      }
      const { status: takenStatus } = await getReferralCodeTakenStatus(account, debouncedReferralCode, chainId);
      // ignore the result if the referral code to check has changed
      if (cancelled) {
        return;
      }
      if (takenStatus === "none") {
        setReferralCodeCheckStatus("ok");
      } else {
        setReferralCodeCheckStatus("taken");
      }
    };
    setReferralCodeCheckStatus("checking");
    checkCodeTakenStatus();
    return () => {
      cancelled = true;
    };
  }, [account, debouncedReferralCode, error, chainId]);

  function getButtonError() {
    if (!referralCode || referralCode.length === 0) {
      return "Enter a code";
    }
    if (referralCodeCheckStatus === "taken") {
      return "Code already taken";
    }
    if (referralCodeCheckStatus === "checking") {
      return "Checking code...";
    }

    return false;
  }

  const buttonError = getButtonError();

  function getPrimaryText() {
    if (buttonError) {
      return buttonError;
    }

    if (isProcessing) {
      return `Creating...`;
    }

    return "Create";
  }
  function isPrimaryEnabled() {
    if (buttonError) {
      return false;
    }
    if (error || isProcessing) {
      return false;
    }
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsProcessing(true);
    const { status: takenStatus } = await getReferralCodeTakenStatus(account, referralCode, chainId);
    if (takenStatus === "taken") {
      setError(`Referral code is taken.`);
      setIsProcessing(false);
    }

    if (takenStatus === "none") {
      setIsProcessing(true);
      try {
        const tx = await handleCreateReferralCode(referralCode);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          recentlyAddedCodes.push(getSampleReferrarStat(referralCode));
          helperToast.success("Referral code created!");
          setRecentlyAddedCodes(recentlyAddedCodes);
          setReferralCode("");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  }
  return (
    <Styles.CodeModal
      isVisible={isCreateCodeModalVisible}
      setIsVisible={setIsCreateCodeModalVisible}
      label="Create Referral Code"
    >
      <>
      <div className="card-action">
        {active ? (
          <>
            <Styles.CodeInput
              className={`text-input ${!error && "mb-sm"}`}
              type="text"
              placeholder="Enter a code"
              maxLength="20"
              pattern="^[a-zA-Z0-9_]*$"
              disabled={isProcessing}
              value={referralCode}
              onChange={({ target }) => {
                let { value } = target;
                setReferralCode(value);
                setError(getCodeError(value));
              }}
            />
            {error && <Styles.ErrorText>{error}</Styles.ErrorText>}
            <Styles.CodeButton className="default-btn" onClick={handleSubmit} disabled={!isPrimaryEnabled()}>{getPrimaryText()}</Styles.CodeButton>
          </>
        ) : (
          <button className="App-cta Exchange-swap-button" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
      </>
    </Styles.CodeModal>
  );
}
