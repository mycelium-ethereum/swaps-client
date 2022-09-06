import React, {useEffect, useRef, useState} from "react";
import { setTraderReferralCodeByUser, encodeReferralCode, validateReferralCodeExists } from "../../Api/referrals";
import { getCodeError, REFERRAL_CODE_REGEX, useDebounce } from "../../Helpers";
import * as Styles from "./Referrals.styles";

export default function EnterCodeModal(props) {
  const {
    account,
    chainId,
    library,
    isEnterCodeModalVisible,
    setIsEnterCodeModalVisible,
    referralCodeInString,
    pendingTxns,
    setPendingTxns,
    isEdit
  } = props;

  const [referralCodeExists, setReferralCodeExists] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralCode, setEditReferralCode] = useState("");
  const [error, setError] = useState("");
  const editModalRef = useRef(null);
  const debouncedEditReferralCode = useDebounce(referralCode, 300);

  const messages = isEdit ? {
    modalTitle: 'Edit Referral Code',
    successMsg: 'Referral code updated!',
    failMsg: 'Referral code update failed.',
    buttonSubmitting: 'Updating...',
    button: 'Update'
  } : {
    modalTitle: 'Enter Referral Code',
    successMsg: 'Referral code added!',
    failMsg: 'Adding referral code failed.',
    buttonSubmitting: 'Submitting...',
    button: 'Submit'
  }

  const close = () => {
    if (!isSubmitting) {
      setEditReferralCode("");
      setError("");
      setIsEnterCodeModalVisible(false);
    }
  };

  const handleClickPrimary = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const referralCodeHex = encodeReferralCode(referralCode);
      const txn = await setTraderReferralCodeByUser(chainId, referralCodeHex, {
        library,
        account,
        successMsg: messages.successMsg,
        failMsg: messages.failMsg,
        pendingTxns,
        setPendingTxns,
      })
      await txn.wait();
      setIsSubmitting(false);
      close();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }
  const getPrimaryText = () => {
    if (referralCode === referralCodeInString && !isSubmitting) {
      return "Referral Code is same";
    }
    if (isSubmitting) {
      return messages.buttonSubmitting;
    }
    if (debouncedEditReferralCode === "") {
      return "Enter Referral Code";
    }
    if (isValidating) {
      return `Checking code...`;
    }
    if (!referralCodeExists) {
      return `Referral Code does not exist`;
    }

    return messages.button
  }
  const isPrimaryEnabled = () => {
    if (
      debouncedEditReferralCode === "" ||
      isSubmitting ||
      isValidating ||
      !referralCodeExists ||
      error ||
      referralCode === referralCodeInString
    ) {
      return false;
    }
    return true;
  }

  useEffect(() => {
    let cancelled = false;
    async function checkReferralCode() {
      if (debouncedEditReferralCode === "" || !REFERRAL_CODE_REGEX.test(debouncedEditReferralCode)) {
        setIsValidating(false);
        setReferralCodeExists(false);
        return;
      }

      setIsValidating(true);
      const codeExists = await validateReferralCodeExists(debouncedEditReferralCode, chainId);
      if (!cancelled) {
        setReferralCodeExists(codeExists);
        setIsValidating(false);
      }
    }
    checkReferralCode();
    return () => {
      cancelled = true;
    };
  }, [debouncedEditReferralCode, chainId]);

  return (
    <Styles.CodeModal
      isVisible={isEnterCodeModalVisible}
      setIsVisible={close}
      label={messages.modalTitle}
    >
      <Styles.CodeInput
        ref={editModalRef}
        disabled={isSubmitting}
        type="text"
        placeholder="Enter referral code"
        className={`text-input ${!error && "mb-sm"}`}
        value={referralCode}
        onChange={({ target }) => {
          const { value } = target;
          setEditReferralCode(value);
          setError(getCodeError(value));
        }}
      />
      {error && <Styles.ErrorText className="error">{error}</Styles.ErrorText>}
      <Styles.CodeButton
        className="default-btn"
        onClick={handleClickPrimary}
        disabled={!isPrimaryEnabled()}
      >
        {getPrimaryText()}
      </Styles.CodeButton>
    </Styles.CodeModal>
  );
}
