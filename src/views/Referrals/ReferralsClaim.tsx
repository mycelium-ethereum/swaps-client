import Modal from "src/components/Modal/Modal";
import Tooltip from "src/components/Tooltip/Tooltip";
import { ETH_DECIMALS, formatAmount, USD_DECIMALS } from "src/Helpers";
import { RewardsButton } from "src/Shared.styles";
import * as Styles from './Referrals.styles';
import { UserRoundData } from "./Referrals.types";

export default function ReferralsClaim ({
  isVisible,
  setIsVisible,
  userRoundData,
  active,
  connectWallet,
  handleClaim,
  isClaiming,
  round
}: {
  isVisible: boolean,
  setIsVisible: (b: boolean) => void,
  userRoundData: UserRoundData,
  currentRewardRound: any,
  active: boolean,
  connectWallet: () => void,
  isClaiming: boolean,
  handleClaim: () => void,
  round: number
}) {
  return (
    <Modal isVisible={isVisible} setIsVisible={setIsVisible} label="Claim Rewards">
      <Styles.ReferralsClaimModalRow>
        <div className="label">Round</div>
        <div>{round + 1}</div>
      </Styles.ReferralsClaimModalRow>
      <Styles.ReferralsClaimModalRow>
        <div>
          <Tooltip
            handle={`Commissions volume`}
            renderContent={() => `Total volume traded on created referral codes`}
          />
        </div>
        <div>${formatAmount(userRoundData?.commissionsVolume, USD_DECIMALS, 2, true)}</div>
      </Styles.ReferralsClaimModalRow>
      <Styles.ReferralsClaimModalRow>
        <div>
          <Tooltip
            handle={`Rebates volume`}
            renderContent={() => `Total volume traded whilst using a referral code (this can be your own referral code)`}
          />
        </div>
        <div>${formatAmount(userRoundData?.rebatesVolume, USD_DECIMALS, 2, true)}</div>
      </Styles.ReferralsClaimModalRow>
      <Styles.ReferralsClaimModalRow>
        <div className="label">Total Rebates</div>
        <div>{formatAmount(userRoundData?.rebates, ETH_DECIMALS, 4, true)} WETH</div>
      </Styles.ReferralsClaimModalRow>
      <Styles.ReferralsClaimModalRow>
        <div className="label">Commissions</div>
        <div>{formatAmount(userRoundData?.commissions, ETH_DECIMALS, 4, true)} WETH</div>
      </Styles.ReferralsClaimModalRow>
      <Styles.ReferralsClaimModalRow>
        <div className="label">Total Reward</div>
        <div>{formatAmount(userRoundData?.totalReward, ETH_DECIMALS, 4, true)} WETH (${formatAmount(userRoundData?.totalRewardUsd, 30, 4, true)})</div>
      </Styles.ReferralsClaimModalRow>
      {active && <RewardsButton
        className={'App-cta large'}
        disabled={!userRoundData?.totalReward || userRoundData.totalReward.eq(0) || isClaiming}
        onClick={handleClaim}
      >
        Claim WETH
      </RewardsButton>}
      {!active && (
        <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
          Connect Wallet
        </Styles.ReferralButton>
      )}
    </Modal>
  )
}
