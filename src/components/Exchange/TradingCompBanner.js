import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import cx from "classnames";
import * as Styles from "./TradingCompBanner.styles";

export default function TradingCompBanner() {
  const [showBanner, setShowBanner] = useState(true);

  const onClose = () => {
    setShowBanner(false);
    window.localStorage.setItem("hasDismissedReferralsBanner", "true");
    document.querySelector(".Exchange")?.classList.remove("ReferralsBannerActive");
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
        <Styles.BannerTitle>Referrals Trading Competition</Styles.BannerTitle>
        <span>Refer more = Earn More</span>
        <Link to="/referrals#commissions">
          <Styles.GenerateButton>Generate & Share your code today to play.</Styles.GenerateButton>
        </Link>
      </Styles.TextContainer>
      <Styles.CloseButton onClick={onClose} />
    </Styles.TradingCompBanner>
  );
}
