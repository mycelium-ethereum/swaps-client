import React, { useEffect } from "react";

import "./BuyMYC.css";

import { ARBITRUM, useChainId } from "../../Helpers";

import Synapse from "../../img/ic_synapse.svg";
import Multiswap from "../../img/ic_multiswap.svg";
import Hop from "../../img/ic_hop.svg";
import Banxa from "../../img/ic_banxa.svg";
import Binance from "../../img/ic_binance_logo.svg";
import mycArbitrum from "../../img/ic_gmx_arbitrum.svg";
import ohmArbitrum from "../../img/ic_olympus_arbitrum.svg";
import Button from "../../components/Common/Button";

export default function BuyMYC() {
  const { chainId } = useChainId();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="BuyMYCMLP page-layout">
      <div className="BuyMYCMLP-container default-container">
        {chainId === ARBITRUM && (
          <div className="section-title-block">
            <div className="section-title-content">
              <div className="Page-title">Buy / Transfer ETH</div>
              <div className="Page-description">
                ETH is needed on Arbitrum to purchase MYC.
              </div>
            </div>
          </div>
        )}
        {chainId === ARBITRUM && (
          <div className="BuyMYCMLP-panel">
            <div className="App-card no-height">
              <div className="App-card-title">Buy ETH</div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="BuyMYCMLP-description">
                  You can buy ETH directly on{" "}
                  <a href="https://arbitrum.io/" target="_blank" rel="noopener noreferrer">
                    Arbitrum
                  </a>{" "}
                  using Banxa:
                </div>
                <div className="direct-purchase-options">
                  <Button
                    href="https://gmx.banxa.com?coinType=ETH&fiatType=USD&fiatAmount=500&blockchain=arbitrum"
                    imgSrc={Banxa}
                  >
                    Banxa
                  </Button>
                </div>
              </div>
            </div>
            <div className="App-card no-height">
              <div className="App-card-title">Transfer ETH</div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="BuyMYCMLP-description">
                  You can transfer ETH from other networks to Arbitrum using any of the below options:
                </div>
                <div className="bridge-options">
                  <Button
                    href="https://synapseprotocol.com/?inputCurrency=ETH&outputCurrency=ETH&outputChain=42161"
                    align="left"
                    imgSrc={Synapse}
                  >
                    Synapse
                  </Button>
                  <Button href="https://app.multichain.org/#/router" align="left" imgSrc={Multiswap}>
                    Multiswap
                  </Button>
                  <Button
                    href="https://app.hop.exchange/send?token=ETH&sourceNetwork=ethereum&destNetwork=arbitrum"
                    align="left"
                    imgSrc={Hop}
                  >
                    Hop
                  </Button>
                  <Button href="https://binance.com/" align="left" imgSrc={Binance}>
                    Binance
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {chainId === ARBITRUM && (
          <div className="BuyMYCMLP-panel">
            <div className="buy-card">
              <div className="section-title-content">
                <div className="card-title">Buy MYC</div>
              </div>
              <div className="App-card no-height">
                <div className="App-card-content no-title">
                  <div className="BuyMYCMLP-description better-rates-description">
                    After you have ETH, set your network to{" "}
                    <a href="https://arbitrum.io/bridge-tutorial/" target="_blank" rel="noopener noreferrer">
                      Arbitrum
                    </a>{" "}
                    then click the button below:
                  </div>
                  <div className="buy-myc">
                    <Button
                      size="xl"
                      imgSrc={mycArbitrum}
                      href="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a&chain=arbitrum"
                    >
                      Purchase MYC
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="buy-card">
              <div className="section-title-content">
                <div className="card-title">Buy MYC Bonds</div>
              </div>
              <div className="App-card no-height">
                <div className="App-card-content no-title">
                  <div className="BuyMYCMLP-description">
                    MYC bonds can be bought on Olympus Pro with a discount and a small vesting period:
                  </div>
                  <div className="buy-myc">
                    <Button size="xl" imgSrc={ohmArbitrum} href="https://pro.olympusdao.finance/#/partners/MYC">
                      Olympus Pro
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
