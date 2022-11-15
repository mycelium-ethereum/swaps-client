import Modal from "src/components/Modal/Modal";
import {ETH_DECIMALS, formatAmount, formatDate, USD_DECIMALS} from "src/Helpers";
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
        <div className="label">Total volume</div>
        <div>${formatAmount(userRoundData?.volume, USD_DECIMALS, 4, true)}</div>
      </Styles.ReferralsClaimModalRow>
      <Styles.ReferralsClaimModalRow>
        <div className="label">Commissions</div>
        <div>{formatAmount(userRoundData?.commissions, ETH_DECIMALS, 4, true)} WETH</div>
      </Styles.ReferralsClaimModalRow>
      <Styles.ReferralsClaimModalRow>
        <div className="label">Rebates</div>
        <div>{formatAmount(userRoundData?.rebates, ETH_DECIMALS, 4, true)} WETH</div>
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
