import React, { useEffect, useState } from "react";
import { bigNumberify, helperToast } from "../../Helpers";
import { encodeReferralCode, getReferralCodeTakenStatus, registerReferralCode } from '../../Api/referrals';
import * as Styles from "./Referrals.styles";
import useDebounce from "../../hooks/useDebounce";
import { getCodeError } from "../../utils/referrals";

const getSampleReferrerStat = (code) => {
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
    library,
    active,
    isCreateCodeModalVisible,
    setIsCreateCodeModalVisible,
    recentlyAddedCodes,
    setRecentlyAddedCodes,
    connectWallet,
    pendingTxns,
    setPendingTxns
  } = props;

  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [referralCodeCheckStatus, setReferralCodeCheckStatus] = useState("ok");
  const debouncedReferralCode = useDebounce(referralCode, 300);

  const close = () => {
    if (!isSubmitting) {
      setReferralCode("");
      setIsSubmitting(false);
      setError("");
      setIsCreateCodeModalVisible(false);
    }
  };

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

    if (isSubmitting) {
      return `Creating...`;
    }

    return "Create";
  }
  function isPrimaryEnabled() {
    if (buttonError) {
      return false;
    }
    if (error || isSubmitting) {
      return false;
    }
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    const { status: takenStatus } = await getReferralCodeTakenStatus(account, referralCode, chainId);
    if (takenStatus === "taken") {
      setError(`Referral code is taken.`);
      setIsSubmitting(false);
    }

    if (takenStatus === "none") {
      setIsSubmitting(true);
      try {
        const referralCodeHex = encodeReferralCode(referralCode);
        const tx = await registerReferralCode(chainId, referralCodeHex, {
          library,
          sentMsg: "Referral code submitted!",
          failMsg: "Referral code creation failed.",
          pendingTxns,
          setPendingTxns
        });
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          recentlyAddedCodes.push(getSampleReferrerStat(referralCode));
          helperToast.success("Referral code created!");
          setRecentlyAddedCodes(recentlyAddedCodes);
          setReferralCode("");
          setIsSubmitting(false);
          close();
        } else {
          setIsSubmitting(false);
        }
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
      }
    }
  }
  return (
    <Styles.CodeModal
      isVisible={isCreateCodeModalVisible}
      setIsVisible={close}
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
              disabled={isSubmitting}
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
