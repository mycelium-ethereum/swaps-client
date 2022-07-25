import React, { useEffect, useState } from "react";
import "./ConsentModal.css";
import close from "../../img/close.svg";

function ConsentModal({ hasConsented, setConsented }) {
  const [visible, setVisible] = useState(false);

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
    const timer = setTimeout(() => {
      if (hasConsented === false) {
        setVisible(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [hasConsented]);

  return (
    <div className={`ConsentModal ${visible ? "visible" : ""}`}>
      <button onClick={handleReject} className="ConsentModal-close-btn">
        <img src={close} alt="Close" className="ConsentModal-close-btn-icon" />
      </button>
      <div>
        <p>
          <b>We use cookies on this site to enhance your user experience.</b>
        </p>
        <p>
          By continuing to browse, you agree to the storing of cookies on your device to enhance your site experience
          and for analytical purposes. By clicking ‘Accept’, you agree to the placement and use of cookies as described
          in our{" "}
          <a href="https://www.tracer.finance/privacy-policy/" rel="noopener noreferrer" target="_blank">
            Privacy Policy
          </a>
          .
        </p>
        <div className="ConsentModal-buttons">
          <button className="default-btn read-more" onClick={handleAccept}>
            Accept
          </button>
          <button className="default-btn read-more" onClick={handleReject}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConsentModal;
