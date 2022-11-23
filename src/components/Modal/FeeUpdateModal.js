import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Modal from "./Modal";

export default function FeeUpdateModal() {
  const location = useLocation();
  const [isFeeUpdateModalVisible, setIsFeeUpdateModalVisible] = useState(false);
  useEffect(() => {
    const routesToShowUpdateOn = ["/", "/earn", "/rewards"];
    if (routesToShowUpdateOn.includes(location.pathname)) {
      const hasSeenFeeUpdateModal = window.localStorage.getItem("feeUpdateModalSeen");
      if (!hasSeenFeeUpdateModal) {
        setIsFeeUpdateModalVisible(true);
        window.localStorage.setItem("feeUpdateModalSeen", "true");
      }
    }
  }, [location.pathname]);

  const onClickPrimary = () => {
    setIsFeeUpdateModalVisible(false);
  };

  return (
    <Modal
      isVisible={isFeeUpdateModalVisible}
      setIsVisible={setIsFeeUpdateModalVisible}
      label="Fee Distribution Update"
      className="FeeModal"
    >
      <div className="Fee-update-modal-content">
        <div>
          <p>
            To ensure Mycelium is on average the cheapest venue to trade on, we have implemented the following changes:
            <ul>
              <li>Mycelium has decreased the base spot swap fee and the sensitivity of spot swap fees</li>
              <li> Mycelium has halved the borrowing rate for any given utilisation</li>
              <li>
                Mycelium has decreased the bid-ask spread of all assets by 0.12% but has also increased entry and exit
                fees by 0.06%
              </li>
            </ul>
          </p>
          <p>
            The total fees for trading will not change. All fees generated will be paid to LPs in wETH. Market making
            rewards will be discontinued.
          </p>
          <p>
            For trading rewards, as of Round 7 (commencing on Wednesday, 19th October) trading rewards will be changing
            from 10% of fees to the top 5% of traders to 5% of fees to the top 5% of traders. This change is to make
            trading rewards more competitive.
          </p>
          <p>
            See{" "}
            <a
              href="https://mycelium.xyz/blog/mycelium-s-fee-update-driving-volume-to-drive-rewards"
              rel="noopener noreferrer"
              target="_blank"
            >
              here
            </a>{" "}
            for more information
          </p>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary}>
            Continue
          </button>
        </div>
      </div>
    </Modal>
  );
}
