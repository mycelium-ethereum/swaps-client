import React, { useCallback } from "react";
import { Link } from "react-router-dom";

import mycBigIcon from "../../img/ic_myc_custom.svg";
import mlpBigIcon from "../../img/ic_mlp_custom.svg";

import { ARBITRUM, switchNetwork, useChainId } from "../../Helpers";

import { useWeb3React } from "@web3-react/core";

import APRLabel from "../APRLabel/APRLabel";

export default function TokenCard() {
  const { chainId } = useChainId();
  const { active } = useWeb3React();

  const changeNetwork = useCallback(
    (network) => {
      if (network === chainId) {
        return;
      }
      if (!active) {
        setTimeout(() => {
          return switchNetwork(network, active);
        }, 500);
      } else {
        return switchNetwork(network, active);
      }
    },
    [chainId, active]
  );

  return (
    <div className="Home-token-card-options">
      <div className="Home-token-card-option">
        <div className="Home-token-card-option-icon">
          <img src={mycBigIcon} alt="mycBigIcon" /> MYC
        </div>
        <div className="Home-token-card-option-info">
          <div className="Home-token-card-option-title">
            MYC is the utility and governance token. Accrues 30% of the platform's generated fees.
          </div>
          <div className="Home-token-card-option-apr">
            Arbitrum APR: <APRLabel chainId={ARBITRUM} label="mycAprTotal" />
          </div>
          <div className="Home-token-card-option-action">
            <div className="buy">
              <Link to="/buy_myc" className="default-btn" onClick={() => changeNetwork(ARBITRUM)}>
                Buy on Arbitrum
              </Link>
            </div>
            <a
              href="https://swaps.docs.mycelium.xyz/perpetual-swaps/information-for-lps"
              target="_blank"
              rel="noreferrer"
              className="default-btn read-more"
            >
              Read more
            </a>
          </div>
        </div>
      </div>
      <div className="Home-token-card-option">
        <div className="Home-token-card-option-icon">
          <img src={mlpBigIcon} alt="mlpBigIcon" /> MLP
        </div>
        <div className="Home-token-card-option-info">
          <div className="Home-token-card-option-title">
            MLP is the liquidity provider token. Accrues 70% of the platform's generated fees.
          </div>
          <div className="Home-token-card-option-apr">
            Arbitrum APR: <APRLabel chainId={ARBITRUM} label="mlpAprTotal" key="ARBITRUM" />
          </div>
          <div className="Home-token-card-option-action">
            <div className="buy">
              <Link to="/buy_mlp" className="default-btn" onClick={() => changeNetwork(ARBITRUM)}>
                Buy on Arbitrum
              </Link>
            </div>
            <a
              href="https://swaps.docs.mycelium.xyz/protocol-design/mycelium-liquidity-pool-mlp/mlp-token#pricing"
              target="_blank"
              rel="noreferrer"
              className="default-btn read-more"
            >
              Read more
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
