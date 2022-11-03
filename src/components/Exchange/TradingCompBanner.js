import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import cx from "classnames";
import Countdown from "react-countdown";
import * as Styles from "./TradingCompBanner.styles";

const COMP_END_TS = 1668556800000; // 2022-11-16 10:00:00 AEST

export default function TradingCompBanner() {
  const [showBanner, setShowBanner] = useState(true);

  const onClose = () => {
    setShowBanner(false);
    window.localStorage.setItem("hasDismissedReferralsBanner", "true");
    document.querySelector(".Exchange")?.classList.remove("ReferralsBannerActive");
  };

  const countdownRenderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return (
        <span>
          0d {hours}h {minutes}m {seconds}s
        </span>
      );
    } else {
      return (
        <span>
          {`${days ? `${days}d` : ``} ${hours ? `${hours}h` : ``} ${minutes ? `${minutes}m` : ``} ${
            seconds ? `${seconds}s` : ``
          }`}
        </span>
      );
    }
  };

  useEffect(() => {
    const hasDismissedBanner = window.localStorage.getItem("hasDismissedReferralsBanner");
    if (hasDismissedBanner) {
      onClose();
    }
  }, []);

  return (
    <Styles.TradingCompBanner
      className={cx("trading-comp-banner", {
        active: showBanner,
      })}
    >
      <div />
      <Styles.TextContainer>
        <Styles.FlexContainer>
          <Styles.LiveIcon /> <Styles.GreenText>Live</Styles.GreenText>
        </Styles.FlexContainer>
        <Styles.BannerTitle>Referrals Competition</Styles.BannerTitle>
        <span>
          Time left: <Countdown date={COMP_END_TS} renderer={countdownRenderer} intervalDelay={0} precision={3} />
        </span>
        <Link to="/referrals#commissions">
          <Styles.GenerateButton>Generate & share your code today to play.</Styles.GenerateButton>
        </Link>
      </Styles.TextContainer>
      <Styles.CloseButton onClick={onClose} />
    </Styles.TradingCompBanner>
  );
}
