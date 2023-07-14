import Tooltip from "../../components/Tooltip/Tooltip";
import { TIER_DISCOUNT_INFO } from "../../config/referrals";
import { getTierIdDisplay } from "../../utils/referrals";
import * as Styles from "./Referrals.styles";

export default function TraderRebateStats(props) {
  const { active, connectWallet, handleSetIsEnterCodeModalVisible, referralCodeInString, tradersTier } = props;

  return (
    <>
      {referralCodeInString ? (
        <Styles.ReferralData className="App-card">
          <Styles.InputCodeText>
            <Styles.AppCardTitle>Active code: {referralCodeInString}</Styles.AppCardTitle>
            {tradersTier && (
              <div className="tier">
                <Tooltip
                  handle={`Tier ${getTierIdDisplay(tradersTier)} (${TIER_DISCOUNT_INFO[tradersTier]}% discount)`}
                  position="right-bottom"
                  renderContent={() =>
                    `You will receive a ${TIER_DISCOUNT_INFO[tradersTier]}% discount on your opening and closing fees, this discount will be airdropped to your account every Wednesday`
                  }
                />
              </div>
            )}
            {!active ? (
              <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
                Connect Wallet
              </Styles.ReferralButton>
            ) : (
              <Styles.ReferralButton
                className="App-cta large"
                onClick={() => handleSetIsEnterCodeModalVisible(/* isEdit */ true)}
              >
                Edit Code
              </Styles.ReferralButton>
            )}
          </Styles.InputCodeText>
        </Styles.ReferralData>
      ) : (
        <>
          {/* <Styles.InputCodeText>
          <Styles.AppCardTitle>Enter Referral Code</Styles.AppCardTitle>
          <p>Add a referral code below to receive fee discounts.</p>
          {!active ? (
            <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
              Connect Wallet
            </Styles.ReferralButton>
          ) : (
              <Styles.ReferralButton className="App-cta large" onClick={() => handleSetIsEnterCodeModalVisible( false)}>
              Enter Code
            </Styles.ReferralButton>
          )}
        </Styles.InputCodeText> */}
        </>
      )}
    </>
  );
}
