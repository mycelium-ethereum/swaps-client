import React from "react";
import * as Styles from "./Referrals.styles";

export default function ReferralCodeModal(props) {
  const { isCodeModalVisible, setIsCodeModalVisible } = props;
  return (
    <Styles.CodeModal
      // className="Connect-wallet-modal"
      isVisible={isCodeModalVisible}
      setIsVisible={setIsCodeModalVisible}
      label="Create Referral Code"
    >
      <Styles.CodeInput type="text" placeholder="Enter a code" maxLength={20} />
      <span className="error-text" />
      <Styles.CodeButton className="default-btn">Enter a code</Styles.CodeButton>
    </Styles.CodeModal>
  );
}
