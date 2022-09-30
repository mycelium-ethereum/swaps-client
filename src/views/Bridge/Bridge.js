import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import SEO from "../../components/Common/SEO";
import { getPageTitle, useChainId, preventStrangeNumberInputs } from "../../Helpers";
import TokenSelector from "../../components/Exchange/TokenSelector";
import * as Styles from "./Bridge.styles";
import settingsIcon from "../../img/settings.svg";
import { getTokens, getWhitelistedTokens, getTokenBySymbol } from "../../data/Tokens";
import { IoMdSwap } from "react-icons/io";
import { getConstant } from "../../Constants";

const { AddressZero } = ethers.constants;

export default function Rewards(props) {
  const { connectWallet, trackPageWithTraits, trackAction, analytics, setPendingTxns, infoTokens } = props;
  const { chainId } = useChainId();
  const { active, account, library } = useWeb3React();

  const defaultCollateralSymbol = getConstant(chainId, "defaultCollateralSymbol");
  const defaultTokenSelection = {
    from: AddressZero,
    to: getTokenBySymbol(chainId, defaultCollateralSymbol).address,
  };

  const [fromNetwork, setFromNetwork] = useState(chainId);
  const [toNetwork, setToNetwork] = useState(chainId);
  const [fromTokenAddress, setFromTokenAddress] = useState(defaultTokenSelection.from);
  const [toTokenAddress, setToTokenAddress] = useState(defaultTokenSelection.to);

  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");

  const onFromValueChange = (e) => {
    setFromValue(e.target.value);
  };

  const onToValueChange = (e) => {
    setToValue(e.target.value);
  };

  const onSelectFromToken = (token) => {
    setFromTokenAddress(token.address);
  };

  const onSelectToToken = (token) => {
    setToTokenAddress(token.address);
  };

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const toTokens = whitelistedTokens.filter((token) => !token.isStable && !token.isWrapped);
  const fromTokens = getTokens(chainId);

  const switchTokensAndNetwork = () => {
    const tempFromToken = fromTokenAddress;
    const tempFromNetwork = fromNetwork;
    setFromTokenAddress(toTokenAddress);
    setFromNetwork(toNetwork);
    setToTokenAddress(tempFromToken);
    setToNetwork(tempFromNetwork);
  };

  return (
    <>
      <SEO
        title={getPageTitle("Bridge")}
        description="Claim fees earned via being in the top 50% of traders on Mycelium Perpetual Swaps."
      />
      <Styles.StyledBridgePage>
        <Styles.BridgeTable>
          <Styles.Header>
            <span>Bridge</span>
            <Styles.SettingsIcon src={settingsIcon} />
          </Styles.Header>
          <Styles.TokenBox>
            <Styles.Label>From</Styles.Label>
            <Styles.Divider />
            <Styles.FlexRowFull>
              <Styles.AmountInput
                type="number"
                min="0"
                placeholder="0.0"
                value={fromValue}
                onChange={onFromValueChange}
                onKeyDown={preventStrangeNumberInputs}
              />
              <Styles.FlexRow>
                <Styles.MaxButton />
                <TokenSelector
                  label="Pay"
                  chainId={chainId}
                  tokenAddress={fromTokenAddress}
                  onSelectToken={onSelectFromToken}
                  tokens={fromTokens}
                  infoTokens={infoTokens}
                  showTokenImgInDropdown={true}
                  trackAction={trackAction}
                />
              </Styles.FlexRow>
            </Styles.FlexRowFull>
          </Styles.TokenBox>
          <div className="Exchange-swap-ball-container">
            <div className="Exchange-swap-ball" onClick={switchTokensAndNetwork}>
              <IoMdSwap className="Exchange-swap-ball-icon" />
            </div>
          </div>
          <Styles.TokenBox>
            <Styles.Label>To</Styles.Label>
            <Styles.Divider />
            <Styles.FlexRowFull>
              <Styles.AmountInput
                type="number"
                min="0"
                placeholder="0.0"
                value={toValue}
                onChange={onToValueChange}
                onKeyDown={preventStrangeNumberInputs}
              />
              <Styles.FlexRow>
                <Styles.MaxButton />
                <TokenSelector
                  label="Receive"
                  chainId={chainId}
                  tokenAddress={toTokenAddress}
                  onSelectToken={onSelectToToken}
                  tokens={toTokens}
                  infoTokens={infoTokens}
                  showTokenImgInDropdown={true}
                  trackAction={trackAction}
                />
              </Styles.FlexRow>
            </Styles.FlexRowFull>
          </Styles.TokenBox>
        </Styles.BridgeTable>
      </Styles.StyledBridgePage>
    </>
  );
}
