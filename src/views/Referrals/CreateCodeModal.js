import React from "react";
import * as Styles from "./Referrals.styles";

export default function CreateCodeModal(props) {
  const { isCreateCodeModalVisible, setIsCreateCodeModalVisible } = props;
  return (
    <Styles.CodeModal
      isVisible={isCreateCodeModalVisible}
      setIsVisible={setIsCreateCodeModalVisible}
      label="Create Referral Code"
    >
      <Styles.CodeInput type="text" placeholder="Enter a code" maxLength="20" pattern="^[a-zA-Z0-9_]*$" />
      <Styles.ErrorText>Only letters, numbers and underscores are allowed.</Styles.ErrorText>
      <Styles.CodeButton className="default-btn">Enter a code</Styles.CodeButton>
    </Styles.CodeModal>
  );
}
