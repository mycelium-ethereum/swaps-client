import React, {useRef, useState} from "react";
import {setTraderReferralCodeByUser} from "../../Api";
import {encodeReferralCode} from "../../Api/referrals";
import {getCodeError, useDebounce} from "../../Helpers";
import * as Styles from "./Referrals.styles";

export default function EnterCodeModal(props) {
  const {
    account,
    chainId,
    library,
    isEnterCodeModalVisible,
    setIsEnterCodeModalVisible,
    setPendingTxns,
    pendingTxns
  } = props;
 
  const [referralCode, setReferralCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSetTraderReferralCode(event) {
    event.preventDefault();
    setIsSubmitting(true);
    const referralCodeHex = encodeReferralCode(referralCode);
    return setTraderReferralCodeByUser(chainId, referralCodeHex, {
      library,
      account,
      successMsg: `Referral code added!`,
      failMsg: "Adding referral code failed.",
      setPendingTxns,
      pendingTxns,
    })
      .then((res) => {
      })
      .finally(() => {
        setIsSubmitting(false);
        setIsEnterCodeModalVisible(false);
      });
  }

  return (
    <Styles.CodeModal
      isVisible={isEnterCodeModalVisible}
      setIsVisible={setIsEnterCodeModalVisible}
      label="Enter Referral Code"
    >
      <Styles.CodeInput
        type="text"
        value={referralCode}
        disabled={isSubmitting}
        className={`text-input ${!error && "mb-sm"}`}
        placeholder="Enter a code"
        onChange={({ target }) => {
          let { value } = target;
          setReferralCode(value);
          setError(getCodeError(value));
        }}
      />
      <Styles.ErrorText className="error">{error}</Styles.ErrorText>
      <Styles.CodeButton
        className="default-btn"
        onClick={handleSetTraderReferralCode}
        disabled={!referralCode.trim() || isSubmitting}
      >
        {isSubmitting ? "Submitting.." : "Submit"}
      </Styles.CodeButton>
    </Styles.CodeModal>
  );
}
