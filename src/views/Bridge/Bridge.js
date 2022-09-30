import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import { IoMdSwap } from "react-icons/io";
import SEO from "../../components/Common/SEO";
import {
  getPageTitle,
  useChainId,
  preventStrangeNumberInputs,
  isSupportedChain,
  fetcher,
  parseValue,
  approveTokens,
  getTokenInfo,
} from "../../Helpers";
import TokenSelector from "../../components/Exchange/TokenSelector";
import { getTokens, getToken, getWhitelistedTokens, getTokenBySymbol } from "../../data/Tokens";
import { getConstant } from "../../Constants";
import Token from "../../abis/Token.json";
import * as Styles from "./Bridge.styles";
import { getContract } from "../../Addresses";
import settingsIcon from "../../img/settings.svg";
import arbitrumIcon from "../../img/arbitrum.svg";
import ethereumIcon from "../../img/ethereum.svg";
import chevronDownIcon from "../../img/chevron-down-white.svg";
import { SettingsDropdown } from "../../components/Bridge/SettingsDropdown";

const { AddressZero } = ethers.constants;

const SUPPORTED_NETWORKS = {
  1: { label: "Ethereum", icon: ethereumIcon },
  42161: { label: "Arbitrum", icon: arbitrumIcon },
};

export default function Bridge(props) {
  const { connectWallet, trackPageWithTraits, trackAction, analytics, pendingTxns, setPendingTxns, infoTokens } = props;
  const { chainId } = useChainId();
  const { active, account, library } = useWeb3React();

  const defaultCollateralSymbol = getConstant(chainId, "defaultCollateralSymbol");
  const defaultTokenSelection = {
    from: AddressZero,
    to: getTokenBySymbol(chainId, defaultCollateralSymbol).address,
  };

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fromNetwork, setFromNetwork] = useState(SUPPORTED_NETWORKS[chainId]);
  const [toNetwork, setToNetwork] = useState(SUPPORTED_NETWORKS[1]);
  const [fromTokenAddress, setFromTokenAddress] = useState(defaultTokenSelection.from);
  const [toTokenAddress, setToTokenAddress] = useState(defaultTokenSelection.to);

  const [slippage, setSlippage] = useState(-0.14);
  const [selectedSetting, setSelectedSetting] = useState("High Return");

  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");

  const fromToken = getToken(chainId, fromTokenAddress);
  const toToken = getToken(chainId, toTokenAddress);

  const fromAmount = parseValue(fromValue, fromToken && fromToken.decimals);
  const toAmount = parseValue(toValue, toToken && toToken.decimals);

  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const routerAddress = getContract(chainId, "Router");

  const tokenAllowanceAddress = fromTokenAddress === AddressZero ? nativeTokenAddress : fromTokenAddress;
  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, tokenAllowanceAddress, "allowance", account, routerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

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

  const needApproval =
    fromTokenAddress !== AddressZero && tokenAllowance && fromAmount && fromAmount.gt(tokenAllowance);

  const getPrimaryText = () => {
    if (!active) {
      return "Connect Wallet";
    }
    if (!isSupportedChain(chainId)) {
      return "Incorrect Network";
    }

    if (needApproval && isWaitingForApproval) {
      return "Waiting for Approval";
    }
    if (isApproving) {
      return `Approving ${fromToken.symbol}...`;
    }
    if (needApproval) {
      return `Approve ${fromToken.symbol}`;
    }
  };

  const approveFromToken = () => {
    approveTokens({
      setIsApproving,
      library,
      tokenAddress: fromToken.address,
      spender: routerAddress,
      chainId: chainId,
      onApproveSubmitted: () => {
        setIsWaitingForApproval(true);
      },
      infoTokens,
      getTokenInfo,
      pendingTxns,
      setPendingTxns,
    });
  };

  const onClickPrimary = () => {
    if (!active) {
      props.connectWallet();
      return;
    }

    if (needApproval) {
      approveFromToken();
      return;
    }
  };

  const isPrimaryEnabled = () => {
    if (!active) {
      return true;
    }
    if ((needApproval && isWaitingForApproval) || isApproving) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isSubmitting) {
      return false;
    }

    return true;
  };

  const settingsContent = [
    {
      label: "High Return",
      func: () => {},
    },
    {
      label: "Fastest",
      func: () => {},
    },
    {
      label: "Low Gas Fee",
      func: () => {},
    },
  ];

  return (
    <>
      <SEO
        title={getPageTitle("Bridge")}
        description="Claim fees earned via being in the top 50% of traders on Mycelium Perpetual Swaps."
      />
      <Styles.SettingsModal isVisible={isSettingsVisible} setIsVisible={setIsSettingsVisible} label="Settings">
        <SettingsDropdown
          settingsContent={settingsContent}
          selectedSetting={selectedSetting}
          setSelectedSetting={setSelectedSetting}
        />
      </Styles.SettingsModal>
      <Styles.StyledBridgePage>
        <Styles.BridgeTable>
          <Styles.Header>
            <span>Bridge</span>
            <Styles.SettingsButton onClick={() => setIsSettingsVisible(true)}>
              <img src={settingsIcon} alt="Settings" />
            </Styles.SettingsButton>
          </Styles.Header>
          <Styles.TokenBox>
            <Styles.Label>From</Styles.Label>
            <Styles.TokenButton>
              <img className="token-icon" src={fromNetwork.icon} alt={fromNetwork.label} />
              <span className="token-name">{fromNetwork.label}</span>
              <img className="chevron-down" src={chevronDownIcon} alt="Chevron down" />
            </Styles.TokenButton>
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
            <Styles.TokenButton>
              <img className="token-icon" src={toNetwork.icon} alt={toNetwork.label} />
              <span className="token-name">{toNetwork.label}</span>
              <img className="chevron-down" src={chevronDownIcon} alt="Chevron down" />
            </Styles.TokenButton>
            <Styles.Divider />
            <Styles.Label>Balance: 0.00</Styles.Label>
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

          <Styles.InfoRow>
            <Styles.Subtitle className="grey">Transaction Fee on Ethereum</Styles.Subtitle>
            <Styles.Subtitle>0.010 ETH</Styles.Subtitle>
          </Styles.InfoRow>

          <Styles.InfoRow>
            <Styles.Subtitle className="grey">Price per ETH on Arbitrum</Styles.Subtitle>
            <Styles.Subtitle>0.995 ETH</Styles.Subtitle>
          </Styles.InfoRow>

          <Styles.InfoRow>
            <Styles.Subtitle className="grey">Price per ETH on Arbitrum</Styles.Subtitle>
            <Styles.Subtitle className="orange">{slippage}%</Styles.Subtitle>
          </Styles.InfoRow>

          <Styles.InfoRow>
            <Styles.TotalText className="grey">
              <b>Total</b>
            </Styles.TotalText>
            <Styles.TotalText>
              <b>0.99568 ETH</b>
            </Styles.TotalText>
          </Styles.InfoRow>

          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </Styles.BridgeTable>
      </Styles.StyledBridgePage>
    </>
  );
}
