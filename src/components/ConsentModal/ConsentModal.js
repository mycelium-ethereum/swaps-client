import React, { useEffect, useState, useMemo } from "react";
import "./ConsentModal.css";
import close from "../../img/close.svg";
import inEU from "@segment/in-eu";

function ConsentModal({ hasConsented, setConsented }) {
  const [visible, setVisible] = useState(false);

  const isInEU = useMemo(() => inEU(), []);

  const outsideEUText = (
    <>
      We use cookies on this site to enhance your user experience. The collection and storage of cookies on your device
      to enhance your site experience and for analytical purposes. We want to respect your right to privacy, so you have
      the option to select your cookie preferences. Note that changes to your preferences may impact your user
      experience.{" "}
      <a href="https://mycelium.xyz/privacy-policy/" rel="noopener noreferrer" target="_blank">
        Privacy Policy
      </a>
      .
    </>
  );

  const insideEUText = (
    <>
      We use cookies on this site to enhance your user experience. The collection and storage of cookies on your device
      to enhance your site experience and for analytical purposes. We want to respect your right to privacy, so you have
      the option to select your cookie preferences. Note that changes to your preferences may impact your user
      experience.{" "}
      <a href="https://mycelium.xyz/privacy-policy/" rel="noopener noreferrer" target="_blank">
        Privacy Policy
      </a>
      .
    </>
  );

  const handleAccept = () => {
    localStorage.setItem("consentAcknowledged", "true");
    setConsented("true");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("consentAcknowledged", "false");
    setConsented("false");
    setVisible(false);
  };

  useEffect(() => {
    const isBraveBrowser = navigator?.brave;
    // Default opt-in for users outside the EU
    if (!isInEU) {
      localStorage.setItem("consentAcknowledged", "true");
    }
    const timer = setTimeout(() => {
      if (hasConsented === false && !isBraveBrowser) setVisible(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [hasConsented, isInEU]);

  return (
    <div className={`ConsentModal ${visible ? "visible" : ""}`}>
      <button onClick={handleReject} className="ConsentModal-close-btn">
        <img src={close} alt="Close" className="ConsentModal-close-btn-icon" />
      </button>
      <div className="ConsentModal-text">
        <p>
          <b>We use cookies on this site to enhance your user experience.</b>
        </p>
        <p>{!isInEU ? insideEUText : outsideEUText}</p>
        <div className="ConsentModal-buttons">
          {!isInEU ? (
            <button className="default-btn read-more" onClick={handleAccept}>
              Dismiss
            </button>
          ) : (
            <>
              <button className="default-btn read-more" onClick={handleAccept}>
                Accept
              </button>
              <button className="default-btn read-more" onClick={handleReject}>
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConsentModal;
