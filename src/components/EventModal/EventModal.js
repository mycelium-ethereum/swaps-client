import React, { useEffect } from "react";
import * as Styled from "./EventModal.styles";
import ethMergeHeader from "../../img/event-modal-header.png";
import ethMergeHeadermesh from "../../img/event-modal-header-mesh.png";
import twitterIcon from "../../img/twitter-icon.svg";
import { Link } from "react-router-dom";
import { shareToTwitter } from "../../utils/common";

const EVENTS = {
  seenPopupV4: {
    title: (
      <>
        <small>Pool Composition Changes</small>
      </>
    ),
    description: (
      <>
        <span>
          Commencing this week, we are deprecating other assets currently supported in the MLP Composition (UNI, FRAX,
          FXS, BAL and CRV). During this transition period, there will be a gradual reduction in support for these
          assets. Meaning there will be increasing limits to trading the assets, and full support to swap the assets for
          USDC, DAI, USDT, ETH, BTC and LINK, both directly and through aggregators like OpenOcean, until they hit zero
          composition and are removed entirely from MLP.
        </span>
        <span>All open positions with these tokens can be closed.</span>
        <span>
          Read more about the changes{" "}
          <a href="https://mycelium.xyz/blog/mlp-composition-is-about-to-change" className="inline-link">
            here
          </a>
          .
        </span>
      </>
    ),
  },
  seenPopupV3: {
    title: (
      <>
        <small>Upcoming Changes</small>
      </>
    ),
    description: (
      <>
        <span>
          Notice to Australian users of Perpetual Swaps, Perpetual Pools, MYC Staking, and the TCR to MYC Token
          Migration portals.
        </span>
        <span>
          Please note that from 11:59 pm AEST on 16 December 2022, Australian users will be geo-blocked from accessing
          these subdomains. It is recommended that Australian users close out any involvement they have with these four
          products before this time.
        </span>
      </>
    ),
  },
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
};

export default function EventModal({
  isModalVisible,
  setEventModalVisible,
  twitterButtonText,
  twitterText,
  eventKey,
  hideHeader,
  requiresConfirmation,
}) {
  const event = EVENTS[eventKey];

  useEffect(() => {
    const hasSeenEventModal = window.localStorage.getItem(eventKey);
    if (!hasSeenEventModal) {
      setEventModalVisible(true);
      if (!requiresConfirmation) {
        window.localStorage.setItem(eventKey, "true");
      }
    }
  }, [eventKey, setEventModalVisible, requiresConfirmation]);

  const onContinue = () => {
    window.localStorage.setItem(eventKey, "true");
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
          {event.description}
          {twitterText && (
            <button className="App-button-option App-card-option" onClick={() => shareToTwitter(twitterText)}>
              <img src={twitterIcon} alt="Twitter" /> {twitterButtonText ? twitterButtonText : "Share on Twitter"}
            </button>
          )}
          {event.continueLink ? (
            <Link to={event.continueLink} onClick={onContinue} className="App-button-option App-card-option">
              {event.continueLinkText ? event.continueLinkText : `Continue`}
            </Link>
          ) : (
            <button className="App-button-option App-card-option" onClick={onContinue}>
              {event.continueLinkText ? event.continueLinkText : `Continue`}
            </button>
          )}
        </Styled.EventModalButtonContent>
      </Styled.EventModalContent>
    </Styled.EventModal>
  );
}
