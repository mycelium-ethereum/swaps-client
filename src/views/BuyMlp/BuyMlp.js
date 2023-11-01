import { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";

import MlpSwap from "../../components/Mlp/MlpSwap";

import "./BuyMlp.css";

import { getPageTitle, useChainId } from "../../Helpers";
import SEO from "../../components/Common/SEO";
import { getNativeToken } from "../../data/Tokens";

export default function BuyMlp(props) {
  const { chainId } = useChainId();
  const history = useHistory();
  const isBuying = false;
  const nativeTokenSymbol = getNativeToken(chainId).symbol;

  return (
    <>
      <SEO
        title={getPageTitle("Buy")}
        description="Buy MLP tokens to provide liquidity to Mycelium’s Perpetual Swaps. MLP tokens represent a share in a yield bearing diversified pool of blue-chip crypto assets."
      />
      <div className="default-container buy-tlp-content page-layout">
        <div className="section-title-block">
          {/*
            <div className="section-title-icon">
              <img src={buyMLPIcon} alt="buyMLPIcon" />
            </div>
          */}
          <div className="section-title-content">
            <div className="Page-title">Sell MLP</div>
            <div className="Page-description">
              Sell your MLP for available pool assets
              <br />
              Read the Terms of Use{" "}
              <a href="https://mycelium.xyz/rewards-terms-of-use" target="_blank" rel="noopener noreferrer">
                here
              </a>
              .
            </div>
          </div>
        </div>
        <MlpSwap {...props} isBuying={isBuying}/>
      </div>
    </>
  );
}
