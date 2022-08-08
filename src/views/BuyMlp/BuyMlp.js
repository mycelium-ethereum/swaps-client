import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";

import GlpSwap from "../../components/Glp/GlpSwap";
import Footer from "../../Footer";
import "./BuyMlp.css";

import { useChainId } from "../../Helpers";
import { getNativeToken } from "../../data/Tokens";

export default function BuyGlp(props) {
  const { chainId } = useChainId();
  const history = useHistory();
  const [isBuying, setIsBuying] = useState(true);
  const nativeTokenSymbol = getNativeToken(chainId).symbol;

  useEffect(() => {
    const hash = history.location.hash.replace("#", "");
    const buying = hash === "redeem" ? false : true;
    setIsBuying(buying);
  }, [history.location.hash]);

  return (
    <div className="default-container buy-tlp-content page-layout">
      <div className="section-title-block">
        {/*
          <div className="section-title-icon">
            <img src={buyGLPIcon} alt="buyGLPIcon" />
          </div>
        */}
        <div className="section-title-content">
          <div className="Page-title">Buy / Sell MLP</div>
          <div className="Page-description">
            Purchase{" "}
            <a
              href="https://tracer-1.gitbook.io/tracer-perpetual-swaps/6VOYVKGbCCw0I8cj7vdF/protocol-design/shared-liquidity-pool/tlp-token-pricing"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                props.trackAction &&
                props.trackAction("Button clicked", {
                  buttonName: "TLP tokens link",
                })
              }
            >
              MLP tokens
            </a>{" "}
            to earn {nativeTokenSymbol} fees from swaps and leverages trading.
            <br />
            Note that there is a minimum holding time of 15 minutes after a purchase.
            <br />
            View <Link to="/earn">staking</Link> page.
          </div>
        </div>
      </div>
      <GlpSwap {...props} isBuying={isBuying} setIsBuying={setIsBuying} />
      <Footer />
    </div>
  );
}
