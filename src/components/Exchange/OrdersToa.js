import React, { useState } from "react";

import Modal from "../Modal/Modal";
import Checkbox from "../Checkbox/Checkbox";

import "./OrdersToa.css";

export default function OrdersToa(props) {
  const { setIsVisible, isPluginApproving, approveOrderBook } = props;

  const [isChecked, setIsChecked] = useState(false);

  const onConfirmationClick = () => {
    approveOrderBook().then(() => {
      setIsVisible(false);
    });
  };

  const getPrimaryText = () => {
    if (isPluginApproving) {
      return "Enabling Orders...";
    }
    if (!isChecked) {
      return "Accept terms to enable orders";
    }
    return "Enable Orders";
  };

  const isPrimaryEnabled = () => {
    if (isPluginApproving) {
      return false;
    }
    return isChecked;
  };

  return (
    <Modal setIsVisible={setIsVisible} isVisible={true} label="Enable Orders" className="Orders-toa">
      Note that Conditional Orders are not guaranteed to be executed.
      <br />
      <br />
      This can occur in a few situations including but not exclusive to:
      <br />
      <ul>
        <li>Insufficient liquidity to execute the order</li>
        <li>The mark price which is an aggregate of exchange prices did not reach the specified price</li>
        <li>The specified price was reached but not long enough for it to be executed</li>
        <li>No keeper picked up the order for execution</li>
      </ul>
      <div>
        Additionally, Conditional Orders, once executed, are converted to Market Orders and are not guaranteed to settle
        at the trigger price. Which would be filled at the market price which will be better than or equal to the Take
        Profit price, but, worse than or equal to the Stop Loss price.
      </div>
      <br />
      <div className="Orders-toa-accept-rules">
        <Checkbox isChecked={isChecked} setIsChecked={setIsChecked}>
          <span className="muted">
            Accept that Conditional Orders are not guaranteed to execute and Conditional Orders may not settle at the
            trigger price.
          </span>
        </Checkbox>
      </div>
      <button disabled={!isPrimaryEnabled()} className="App-cta Confirmation-box-button" onClick={onConfirmationClick}>
        {getPrimaryText()}
      </button>
    </Modal>
  );
}
