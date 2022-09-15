import React from "react";
import Tooltip from "../../components/Tooltip/Tooltip";
import { getTierIdDisplay, TIER_DISCOUNT_INFO } from "../../Helpers";
import { Text } from "../../components/Translation/Text";
import * as Styles from "./Referrals.styles";

export default function TraderRebateStats(props) {
  const { active, connectWallet, handleSetIsEnterCodeModalVisible, referralCodeInString, tradersTier } = props;

  return (
    <Styles.ReferralData className="App-card">
      {referralCodeInString ? (
        <Styles.InputCodeText>
          <Styles.AppCardTitle>
            <Text>Active code:</Text> {referralCodeInString}
          </Styles.AppCardTitle>
          {tradersTier && (
            <div className="tier">
              <Tooltip
                handle={`Tier ${getTierIdDisplay(tradersTier)} (${TIER_DISCOUNT_INFO[tradersTier]}% discount)`}
                position="right-bottom"
                renderContent={() => (
                  <>
                    <Text>You will receive a</Text> ${TIER_DISCOUNT_INFO[tradersTier]}%{" "}
                    <Text>
                      discount on your opening and closing fees, this discount will be airdropped to your account every
                      Wednesday
                    </Text>
                  </>
                )}
              />
            </div>
          )}
          {!active ? (
            <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
              <Text>Connect Wallet</Text>
            </Styles.ReferralButton>
          ) : (
            <Styles.ReferralButton
              className="App-cta large"
              onClick={() => handleSetIsEnterCodeModalVisible(/* isEdit */ true)}
            >
              <Text>Edit Code</Text>
            </Styles.ReferralButton>
          )}
        </Styles.InputCodeText>
      ) : (
        <Styles.InputCodeText>
          <Styles.AppCardTitle>
            <Text>Enter Referral Code</Text>
          </Styles.AppCardTitle>
          <p>
            <Text>Add a referral code below to receive fee discounts.</Text>
          </p>
          {!active ? (
            <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
              <Text>Connect Wallet</Text>
            </Styles.ReferralButton>
          ) : (
            <Styles.ReferralButton
              className="App-cta large"
              onClick={() => handleSetIsEnterCodeModalVisible(/* isEdit */ false)}
            >
              <Text>Enter Code</Text>
            </Styles.ReferralButton>
          )}
        </Styles.InputCodeText>
      )}
    </Styles.ReferralData>
  );
}
