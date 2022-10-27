import React, { useEffect } from "react";
import { shareToTwitter } from "../../Helpers";
import * as Styled from "./EventModal.styles";
import ethMergeHeader from "../../img/event-modal-header.png";
import ethMergeHeadermesh from "../../img/event-modal-header-mesh.png";
import twitterIcon from "../../img/twitter-icon.svg";
import { Link } from "react-router-dom";

const EVENTS = {
  "new-earn-page": {
    title: (
      <>
        <small>Earn Page Update</small>
        {/* Optional large heading */}
        {/* <h2>Fee-Free Spree</h2> */}
      </>
    ),
    description: (
      <span>
        Users can now auto deposit esMYC into the vesting contract and claim Market Making Rewards via selling a portion
        of their MLP position
      </span>
    ),
    continueLink: "/earn",
  },
  "add-limit-orders": {
    title: (
      <>
        <small>Limit Orders Enabled</small>
        {/* Optional large heading */}
        {/* <h2>Fee-Free Spree</h2> */}
      </>
    ),
    description: <span>Mycelium now supports limit orders for opening and closing leveraged positions!</span>,
  },
  "disable-limit-orders": {
    title: (
      <>
        <h2>Limit Orders Disabled</h2>
      </>
    ),
    description: (
      <span>
        Limit orders are currently disabled. Limits will be live again soon. Your previously set limit orders will need
        to be updated.
      </span>
    ),
  },
  "referrals-comp": {
    title: (
      <>
        <h2>
          Referrals Competition is{" "}
          <Styled.LiveSpanContainer>
            <Styled.LiveIcon /> <Styled.GreenText>Live</Styled.GreenText>
          </Styled.LiveSpanContainer>
        </h2>
      </>
    ),
    description: (
      <div>
        <p>
          <b>Share your referral code for the chance to win $20,000 USDC in prizes.</b>
        </p>
        <p>
          The most creative referral code tweet wins third prize of $3,000 USDC. You must tag{" "}
          <a href="twitter.com/mycelium_xyz" target="_blank" rel="noopener noreferrer" className="inline-link">
            @mycelium_xyz
          </a>{" "}
          on Twitter to be eligible.
        </p>
      </div>
    ),
    continueLink: "/referrals#commissions",
    continueLinkText: "Generate code now",
  },
};

export default function EventModal({
  isModalVisible,
  setEventModalVisible,
  twitterButtonText,
  twitterText,
  eventKey,
  hideHeader,
}) {
  const event = EVENTS[eventKey];

  useEffect(() => {
    const hasSeenEventModal = window.localStorage.getItem(eventKey);
    if (!hasSeenEventModal) {
      setEventModalVisible(true);
      window.localStorage.setItem(eventKey, "true");
    }
  }, [eventKey, setEventModalVisible]);

  const onClose = () => {
    setEventModalVisible(false);
  };

  return (
    <Styled.EventModal isVisible={isModalVisible} setIsVisible={setEventModalVisible} hideHeader={hideHeader}>
      {!hideHeader && (
        <Styled.EventModalHeader>
          <Styled.ReferralsCompHeader>
            <Styled.ReferralsCompAmount />
            <Styled.ReferralsCompPrizeText>USDC in prizes</Styled.ReferralsCompPrizeText>
          </Styled.ReferralsCompHeader>
          <Styled.EventModalGraphic infront src={ethMergeHeader} alt="Event modal header graphic" />
          <Styled.EventModalGraphic src={ethMergeHeadermesh} alt="Event modal header mesh" />
        </Styled.EventModalHeader>
      )}
      <Styled.EventModalContent>
        <Styled.EventModalTitle>{event.title}</Styled.EventModalTitle>
        <Styled.EventModalButtonContent className="Button-content">
          <Styled.EventModalCloseButton onClick={onClose} />
          {event.description}
          {twitterText && (
            <button className="App-button-option App-card-option" onClick={() => shareToTwitter(twitterText)}>
              <img src={twitterIcon} alt="Twitter" /> {twitterButtonText ? twitterButtonText : "Share on Twitter"}
            </button>
          )}
          {event.continueLink ? (
            <Link to={event.continueLink} onClick={onClose} className="App-button-option App-card-option">
              {event.continueLinkText ? event.continueLinkText : `Continue`}
            </Link>
          ) : (
            <button className="App-button-option App-card-option" onClick={onClose}>
              {event.continueLinkText ? event.continueLinkText : `Continue`}
            </button>
          )}
        </Styled.EventModalButtonContent>
      </Styled.EventModalContent>
    </Styled.EventModal>
  );
}
