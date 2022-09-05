import React, {useEffect, useRef, useState} from "react";
import { setTraderReferralCodeByUser, encodeReferralCode, validateReferralCodeExists } from "../../Api/referrals";
import { getCodeError, REFERRAL_CODE_REGEX, useDebounce } from "../../Helpers";
import * as Styles from "./Referrals.styles";

export default function EditCodeModal(props) {
  const {
    account,
    chainId,
    library,
    isEditCodeModalVisible,
    setIsEditCodeModalVisible,
    referralCodeInString,
    pendingTxns,
    setPendingTxns,
  } = props;

  const [referralCodeExists, setReferralCodeExists] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editReferralCode, setEditReferralCode] = useState("");
  const [error, setError] = useState("");
  const editModalRef = useRef(null);
  const debouncedEditReferralCode = useDebounce(editReferralCode, 300);

  const close = () => {
    if (!isSubmitting) {
      setEditReferralCode("");
      setError("");
      setIsSubmitting(false);
      setIsEditCodeModalVisible(false);
    }
  };

  const handleUpdateReferralCode = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const referralCodeHex = encodeReferralCode(editReferralCode);
    const txn = await setTraderReferralCodeByUser(chainId, referralCodeHex, {
      library,
      account,
      successMsg: `Referral code updated!`,
      failMsg: "Referral code updated failed.",
      pendingTxns,
      setPendingTxns,
    })
    const receipt = await txn.wait();
    if (receipt.status === 1) {
      setIsSubmitting(false);
      close();
    }
  }
  const getPrimaryText = () => {
    if (editReferralCode === referralCodeInString && !isSubmitting) {
      return "Referral Code is same";
    }
    if (isSubmitting) {
      return "Updating...";
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

    return "Update";
  }
  const isPrimaryEnabled = () => {
    if (
      debouncedEditReferralCode === "" ||
      isSubmitting ||
      isValidating ||
      !referralCodeExists ||
      editReferralCode === referralCodeInString
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
      isVisible={isEditCodeModalVisible}
      setIsVisible={close}
      label="Edit Referral Code"
    >
      <Styles.CodeInput
        ref={editModalRef}
        disabled={isSubmitting}
        type="text"
        placeholder="Enter referral code"
        className={`text-input ${!error && "mb-sm"}`}
        value={editReferralCode}
        onChange={({ target }) => {
          const { value } = target;
          setEditReferralCode(value);
          setError(getCodeError(value));
        }}
      />
      <Styles.ErrorText className="error">{error}</Styles.ErrorText>
      <Styles.CodeButton
        className="default-btn"
        onClick={handleUpdateReferralCode}
        disabled={!isPrimaryEnabled()}
      >
        {getPrimaryText()}
      </Styles.CodeButton>
    </Styles.CodeModal>
  );
}
