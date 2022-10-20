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
};

export default function EventModal({ isModalVisible, setEventModalVisible, twitterText, eventKey }) {
  const eventText = EVENTS[eventKey];

  useEffect(() => {
    const hasSeenEventModal = window.localStorage.getItem(eventKey);
    if (!hasSeenEventModal) {
      setEventModalVisible(true);
      window.localStorage.setItem(eventKey, "true");
    }
  }, [eventKey, setEventModalVisible]);

  return (
    <Styled.EventModal isVisible={isModalVisible} setIsVisible={setEventModalVisible}>
      <Styled.EventModalHeader>
        <Styled.EventModalGraphic infront src={ethMergeHeader} alt="Event modal header graphic" />
        <Styled.EventModalGraphic src={ethMergeHeadermesh} alt="Event modal header mesh" />
      </Styled.EventModalHeader>
      <Styled.EventModalTitle>{eventText.title}</Styled.EventModalTitle>
      <Styled.EventModalButtonContent className="Button-content">
        {eventText.description}
        {eventText.continueLink ? (
          <Link
            to={eventText.continueLink}
            onClick={() => setEventModalVisible(false)}
            className="App-button-option App-card-option"
          >
            Continue
          </Link>
        ) : (
          <button className="App-button-option App-card-option" onClick={() => setEventModalVisible(false)}>
            Continue
          </button>
        )}
        {twitterText && (
          <button className="App-button-option App-card-option" onClick={() => shareToTwitter(twitterText)}>
            Share on Twitter <img src={twitterIcon} alt="Twitter" />
          </button>
        )}
      </Styled.EventModalButtonContent>
    </Styled.EventModal>
  );
}
