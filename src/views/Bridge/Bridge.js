import React, { useState } from "react";
import { ethers, BigNumber} from "ethers";
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
  bigNumberify,
  formatAmount,
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

import { Tokens } from "@synapseprotocol/sdk";
import {CHAINID_NETWORK_MAP, ChainGasAirdrop, ChainGasAirdropToken } from "./BridgeMappings.js"

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

  const [fromTokenType, setFromTokenType] = useState(Tokens.USDC);
  const [toTokenType, setToTokenType] = useState(Tokens.USDC);

  const [transactionFee, setTransactionFee]= useState()

  

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
    setFromTokenType(Tokens.AllTokens.filter(tok => (tok.addresses == token.address))[0])
  };

  const onSelectToToken = (token) => {
    setToTokenAddress(token.address);
    setToTokenType(Tokens.AllTokens.filter(tok => (tok.addresses == token.address))[0])
  };

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const toTokens = whitelistedTokens.filter((token) => !token.isStable && !token.isWrapped);
  const fromTokens = getTokens(chainId);
  const fromTokenInfo = getTokenInfo(infoTokens, fromTokenAddress);
  const fromBalance = fromTokenInfo ? fromTokenInfo.balance : bigNumberify(0);

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
    if(active && needApproval){
      return ("Approve" + JSON.stringify(fromTokenType.symbol)) 
    }
    if(active && !needApproval){
      return "Bridge"
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
      onClickApprove();
      return;
    }

    if(active && !needApproval){
      onClickBridge()
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

  //Synapse Bridge Actions
  let populatedApproveTxn;
  let populatedBridgeTokenTxn;
  let estimate;

        // UseEffect that updates all necessary outputs when input state changes.
        useEffect(() => {
  
          const DUMMY_BRIDGE = new Bridge.SynapseBridge({
              network: CHAINID_NETWORK_MAP[chainId]
          })
          if(fromValue > 0) {
              const getEstimate = 
              //     Get a quote for amount to receive from the bridge
                  DUMMY_BRIDGE.estimateBridgeTokenOutput({
                      tokenFrom: fromTokenType, // token to send from the source chain, in this case USDT on Avalanche
                      //need to edit the below
                      chainIdTo: Object.keys(toNetwork), // Chain ID of the destination chain, in this case BSC
                      tokenTo: toTokenType, // Token to be received on the destination chain, in this case USDC
                      amountFrom: BigNumber.from(fromValue).mul(10**6)
              });
              getEstimate.then(res => setToValue(res.amountToReceive))
              getEstimate.then(res => setTransactionFee(res.bridgeFee/1000000000000000000))
          }  
          else{
            setToValue(0)
            //need to create state variables for the below
            //set gas & gas token 
          }
          //set all variables to update effect on with correct states
      },[])
      

  const onClickApprove = async () => {
      try {
          const SYNAPSE_BRIDGE = new Bridge.SynapseBridge({
              network: CHAINID_NETWORK_MAP[chainId]
            })
          // Create a populated transaction for approving token spending
          populatedApproveTxn = await SYNAPSE_BRIDGE.buildApproveTransaction({
            //need to update list for token type
              token: fromTokenType,
          });
      } catch (e) {
          // handle error if one occurs
      }
      // Sign and send the transaction
      signer.sendTransaction(populatedApproveTxn);
  };
  const onClickBridge = async () => {
      const SYNAPSE_BRIDGE = new Bridge.SynapseBridge({
          network: CHAINID_NETWORK_MAP[chainId]
        })
      // Get a quote for amount to receive from the bridge
      estimate = await SYNAPSE_BRIDGE.estimateBridgeTokenOutput({
          tokenFrom: fromTokenType, // token to send from the source chain, in this case USDT on Avalanche
          chainIdTo: Object.keys(toNetwork), // Chain ID of the destination chain, in this case BSC
          tokenTo: toTokenType, // Token to be received on the destination chain, in this case USDC
          amountFrom: parseUnits(
              JSON.stringify(fromValue),
              BigNumber.from(fromTokenType.decimals(chainId))
              ),        
      });
      try {
          // Create a populated transaction for bridging
          populatedBridgeTokenTxn =
          await SYNAPSE_BRIDGE.buildBridgeTokenTransaction({
              tokenFrom: fromTokenType, // token to send from the source chain, in this case nUSD on Avalanche
              chainIdTo: Object.keys(toNetwork), // Chain ID of the destination chain, in this case BSC
              tokenTo: toTokenType, // Token to be received on the destination chain, in this case USDC
              amountFrom: parseUnits(
                  JSON.stringify(fromValue),
                  BigNumber.from(fromTokenType.decimals(chainId))
                  ), // Amount of `tokenFrom` being sent
              amountTo: estimate.amountToReceive, // minimum desired amount of `tokenTo` to receive on the destination chain
              //need to get the address
              addressTo: address, // the address to receive the tokens on the destination chain
          });
      } catch (e) {
          // handle error if one occurs
      }
      // Sign and send the transaction
      //make sure im getting the signer correctly
      await signer.sendTransaction(populatedBridgeTokenTxn);
  };

//End Synapse Bridge Logic



  console.log(fromToken);

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
            <Styles.Label>Balance: {formatAmount(fromBalance, fromToken.decimals, 4, true)}</Styles.Label>
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
            <Styles.Subtitle>{transactionFee} {fromTokenType.symbol}</Styles.Subtitle>
          </Styles.InfoRow>

          <Styles.InfoRow>
            <Styles.Subtitle className="grey">Gas Recieved</Styles.Subtitle>
            <Styles.Subtitle>{ChainGasAirdrop[Object.keys(toNetwork)[0]]} {ChainGasAirdropToken[Object.keys(toNetwork)[0]]}</Styles.Subtitle>
          </Styles.InfoRow>

          <Styles.InfoRow>
            <Styles.Subtitle className="grey">Price per ETH on Arbitrum</Styles.Subtitle>
            <Styles.Subtitle className="orange">{slippage}%</Styles.Subtitle>
          </Styles.InfoRow>

          {/* Dont really need  */}
          {/* <Styles.InfoRow>
            <Styles.TotalText className="grey">
              <b>Total</b>
            </Styles.TotalText>
            <Styles.TotalText>
              <b>0.99568 ETH</b>
            </Styles.TotalText>
          </Styles.InfoRow> */}

          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </Styles.BridgeTable>
      </Styles.StyledBridgePage>
    </>
  );
}
