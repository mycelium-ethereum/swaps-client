import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { SWRConfig } from "swr";

import { AnimatePresence, motion } from "framer-motion";

import { Web3Provider } from "@ethersproject/providers";
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";

import { NavLink, Route, Switch, useLocation } from "react-router-dom";

import { ThemeProvider } from "@tracer-protocol/tracer-ui";
import { getTokens, getWhitelistedTokens } from "./data/Tokens";
import { useAnalytics } from "./segmentAnalytics";

import {
  CURRENT_PROVIDER_LOCALSTORAGE_KEY,
  IS_PNL_IN_LEVERAGE_KEY,
  REFERRAL_CODE_KEY,
  REFERRAL_CODE_QUERY_PARAMS,
  SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY,
  SHOULD_SHOW_POSITION_LINES_KEY,
  SHOW_PNL_AFTER_FEES_KEY,
  SLIPPAGE_BPS_KEY,
} from "./config/localstorage";

import {
  ARBITRUM,
  ARBITRUM_GOERLI,
  BASIS_POINTS_DIVISOR,
  DEFAULT_SLIPPAGE_AMOUNT,
  PLACEHOLDER_ACCOUNT,
  activateInjectedProvider,
  clearWalletConnectData,
  clearWalletLinkData,
  fetcher,
  formatAmount,
  formatTitleCase,
  getAccountUrl,
  getBalanceAndSupplyData,
  getChainName,
  getDefaultArbitrumGoerliRpcUrl,
  getDefaultArbitrumRpcUrl,
  getExplorerUrl,
  getInjectedHandler,
  getUserTokenBalances,
  getWalletConnectHandler,
  hasChangedAccount,
  hasCoinBaseWalletExtension,
  hasMetaMaskWalletExtension,
  helperToast,
  isMobileDevice,
  networkOptions,
  setCurrentAccount,
  switchNetwork,
  useChainId,
  useEagerConnect,
  useInactiveListener,
  useLocalStorageSerializeKey,
} from "./Helpers";
import ReaderV2 from "./abis/ReaderV2.json";

import Actions from "./views/Actions/Actions";
import Dashboard from "./views/Dashboard/DashboardV2";
import { Exchange } from "./views/Exchange/Exchange";
import OrdersOverview from "./views/OrdersOverview/OrdersOverview";
import PositionsOverview from "./views/PositionsOverview/PositionsOverview";
import Stake from "./views/Stake/StakeV2";
// import BuyMYC from "./views/BuyMYC/BuyMYC";
import BuyMlp from "./views/BuyMlp/BuyMlp";
import Referrals from "./views/Referrals/Referrals";
import Rewards from "./views/Rewards/Rewards";
import SellMlp from "./views/SellMlp/SellMlp";
// import NftWallet from "./views/NftWallet/NftWallet";
// import BeginAccountTransfer from "./views/BeginAccountTransfer/BeginAccountTransfer";
// import CompleteAccountTransfer from "./views/CompleteAccountTransfer/CompleteAccountTransfer";
// import Debug from "./views/Debug/Debug";
import ConsentModal from "./components/ConsentModal/ConsentModal";
import MobileLinks from "./components/Navigation/MobileNav";

import cx from "classnames";
import { ToastContainer, cssTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Checkbox from "./components/Checkbox/Checkbox";
import Modal from "./components/Modal/Modal";
import NetworkSelector from "./components/NetworkSelector/NetworkSelector";
// import Footer from "./Footer";

import { FaTimes } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { RiMenuLine } from "react-icons/ri";

import "./App.css";
import "./AppOrder.css";
import "./Font.css";
import "./Input.css";
import "./Shared.css";

import logoImg from "./img/logo_MYC.svg";
import logoSmallImg from "./img/logo_MYC_small.svg";
// import poolsSmallImg from "./img/myc_pools_short.svg";
import connectWalletImg from "./img/ic_wallet_24.svg";

import { Link } from "react-router-dom";
import { encodeReferralCode } from "./Api/referrals";
import AddressDropdown from "./components/AddressDropdown/AddressDropdown";
import { ConnectWalletButton } from "./components/Common/Button";
import EventToastContainer from "./components/EventToast/EventToastContainer";
import useEventToast from "./components/EventToast/useEventToast";
import useRouteQuery from "./hooks/useRouteQuery";
import coinbaseImg from "./img/coinbaseWallet.png";
import metamaskImg from "./img/metamask.png";
import walletConnectImg from "./img/walletconnect-circle-blue.svg";

import useSWR from "swr";
import { getContract } from "./Addresses";
import PositionRouter from "./abis/PositionRouter.json";
import VaultV2 from "./abis/VaultV2.json";
import VaultV2b from "./abis/VaultV2b.json";
import AppDropdown from "./components/AppDropdown/AppDropdown";
import EventModal from "./components/EventModal/EventModal";
import LinkDropdown from "./components/Navigation/LinkDropdown/LinkDropdown";
import Sidebar from "./components/Navigation/Sidebar/Sidebar";
import { LeaderboardProvider } from "./context/LeaderboardContext";
import { useInfoTokens } from "./hooks/useInfoTokens";
import PageNotFound from "./views/PageNotFound/PageNotFound";
// import { Banner, BannerTitle, BannerContent } from "./components/Banner/Banner";

if ("ethereum" in window) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  return library;
}

const Zoom = cssTransition({
  enter: "zoomIn",
  exit: "zoomOut",
  appendPosition: false,
  collapse: true,
  collapseDuration: 200,
  duration: 200,
});

function inPreviewMode() {
  return false;
}

const arbWsProvider = new ethers.providers.WebSocketProvider(getDefaultArbitrumRpcUrl(true));
const arbTestnetWsProvider = new ethers.providers.JsonRpcProvider(getDefaultArbitrumGoerliRpcUrl(true));

function getWsProvider(active, chainId) {
  if (!active) {
    return;
  }
  if (chainId === ARBITRUM) {
    return arbWsProvider;
  }

  if (chainId === ARBITRUM_GOERLI) {
    return arbTestnetWsProvider;
  }
}

function AppHeaderLinks({ small, openSettings, clickCloseIcon, trackAction }) {
  if (inPreviewMode()) {
    return (
      <div className="App-header-links preview">
        <div className="App-header-link-container App-header-link-home">
          <NavLink activeClassName="active" exact to="/">
            HOME
          </NavLink>
        </div>
        <div className="App-header-link-container">
          <NavLink activeClassName="active" to="/earn">
            EARN
          </NavLink>
        </div>
        <div className="App-header-link-container">
          <a
            href="https://swaps.docs.mycelium.xyz/perpetual-swaps/mycelium-perpetual-swaps"
            target="_blank"
            rel="noopener noreferrer"
          >
            ABOUT
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="App-header-links">
      {small && (
        <div className="App-header-links-header">
          <div className="App-header-menu-icon-block" onClick={() => clickCloseIcon()}>
            <FiX className="App-header-menu-icon" />
          </div>
          <Link
            className="App-header-link-main"
            to="/"
            onClick={() =>
              trackAction &&
              trackAction("Button clicked", {
                buttonName: "Mycelium Nav Logo",
              })
            }
          >
            <img src={logoImg} alt="Mycelium Swaps Logo" />
          </Link>
        </div>
      )}
      <div className="App-header-link-container">
        <NavLink exact activeClassName="active" to="/dashboard">
          Dashboard
        </NavLink>
      </div>
      <div className="App-header-link-container">
        <NavLink exact activeClassName="active" to="/earn">
          Earn
        </NavLink>
      </div>
      <div className="App-header-link-container">
        <NavLink exact activeClassName="active" to="/buy_mlp">
          Buy
        </NavLink>
      </div>
      <div className="App-header-link-container">
        <NavLink exact activeClassName="active" to="/rewards">
          Rewards
        </NavLink>
      </div>
      <div className="App-header-link-container">
        <NavLink exact activeClassName="active" to="/referrals">
          Referrals
        </NavLink>
      </div>
      <div className="App-header-link-container">
        <a
          href="https://swaps.docs.mycelium.xyz/perpetual-swaps/mycelium-perpetual-swaps"
          target="_blank"
          rel="noopener noreferrer"
        >
          Docs
        </a>
      </div>
      {small && (
        <div className="App-header-link-container">
          {/* eslint-disable-next-line */}
          <a href="#" onClick={openSettings}>
            Settings
          </a>
        </div>
      )}
    </div>
  );
}

function AppHeaderUser({
  openSettings,
  small,
  setWalletModalVisible,
  showNetworkSelectorModal,
  disconnectAccountAndCloseSettings,
  trackAction,
}) {
  const { chainId } = useChainId();
  const { active, account } = useWeb3React();
  const showSelector = true;

  useEffect(() => {
    if (active) {
      setWalletModalVisible(false);
    }
  }, [active, setWalletModalVisible]);

  const onNetworkSelect = useCallback(
    (option) => {
      if (option.value === chainId) {
        return;
      }
      return switchNetwork(option.value, active);
    },
    [chainId, active]
  );

  const selectorLabel = getChainName(chainId);

  if (!active) {
    return (
      <div className="App-header-user">
        {showSelector && (
          <NetworkSelector
            options={networkOptions}
            label={selectorLabel}
            onSelect={onNetworkSelect}
            className="App-header-user-netowork"
            showCaret={true}
            modalLabel="Select Network"
            small={small}
            showModal={showNetworkSelectorModal}
            trackAction={trackAction}
          />
        )}
        <ConnectWalletButton
          onClick={() => {
            trackAction && trackAction("Button clicked", { buttonName: "Connect Wallet" });
            setWalletModalVisible(true);
          }}
          imgSrc={connectWalletImg}
        >
          {small ? "Connect" : "Connect Wallet"}
        </ConnectWalletButton>
        {/* <AppDropdown /> */}
      </div>
    );
  }

  const accountUrl = getAccountUrl(chainId, account);

  return (
    <div className="App-header-user">
      {showSelector && (
        <NetworkSelector
          options={networkOptions}
          label={selectorLabel}
          onSelect={onNetworkSelect}
          className="App-header-user-netowork"
          showCaret={true}
          modalLabel="Select Network"
          small={small}
          showModal={showNetworkSelectorModal}
          trackAction={trackAction}
        />
      )}
      <div className="App-header-user-address">
        <AddressDropdown
          account={account}
          small={small}
          accountUrl={accountUrl}
          disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
          openSettings={openSettings}
          trackAction={trackAction}
        />
      </div>
      {/* <AppDropdown /> */}
    </div>
  );
}

function FullApp() {
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loggedInTracked, setLoggedInTracked] = useState(false);
  const { trackLogin, trackPageWithTraits, trackAction, analytics } = useAnalytics();

  const exchangeRef = useRef();
  const { connector, library, deactivate, activate, active, account } = useWeb3React();
  const { chainId } = useChainId();
  const readerAddress = getContract(chainId, "Reader");
  const tokens = getTokens(chainId);
  const tokenAddresses = tokens.map((token) => token.address);
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");

  useEventToast();
  const [activatingConnector, setActivatingConnector] = useState();
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector, chainId]);
  const triedEager = useEagerConnect(setActivatingConnector);
  useInactiveListener(!triedEager || !!activatingConnector);

  const query = useRouteQuery();

  useEffect(() => {
    let referralCode = query.get(REFERRAL_CODE_QUERY_PARAMS);
    if (referralCode && referralCode.length <= 20) {
      const encodedReferralCode = encodeReferralCode(referralCode);
      if (encodeReferralCode !== ethers.constants.HashZero) {
        localStorage.setItem(REFERRAL_CODE_KEY, encodedReferralCode);
      }
    }
  }, [query]);

  const disconnectAccount = useCallback(() => {
    // only works with WalletConnect
    clearWalletConnectData();
    // force clear localStorage connection for MM/CB Wallet (Brave legacy)
    clearWalletLinkData();
    deactivate();
  }, [deactivate]);

  const disconnectAccountAndCloseSettings = () => {
    disconnectAccount();
    localStorage.removeItem(SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY);
    localStorage.removeItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY);
    setIsSettingsVisible(false);
  };

  const connectInjectedWallet = getInjectedHandler(activate);
  const activateWalletConnect = () => {
    getWalletConnectHandler(activate, deactivate, setActivatingConnector)();
  };

  const userOnMobileDevice = "navigator" in window && isMobileDevice(window.navigator);

  const activateMetaMask = () => {
    if (!hasMetaMaskWalletExtension()) {
      helperToast.error(
        <div>
          MetaMask not detected.
          <br />
          <br />
          <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
            Install MetaMask
          </a>
          {userOnMobileDevice ? ", and use MYC with its built-in browser" : " to start using MYC"}.
        </div>
      );
      return false;
    }
    attemptActivateWallet("MetaMask");
  };
  const activateCoinBase = () => {
    if (!hasCoinBaseWalletExtension()) {
      helperToast.error(
        <div>
          Coinbase Wallet not detected.
          <br />
          <br />
          <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">
            Install Coinbase Wallet
          </a>
          {userOnMobileDevice ? ", and use MYC with its built-in browser" : " to start using MYC"}.
        </div>
      );
      return false;
    }
    attemptActivateWallet("CoinBase");
  };

  const attemptActivateWallet = (providerName) => {
    localStorage.setItem(SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY, true);
    localStorage.setItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY, providerName);
    activateInjectedProvider(providerName);
    connectInjectedWallet();
  };

  const [walletModalVisible, setWalletModalVisible] = useState();
  const [isEventModalVisible, setEventModalVisible] = useState(false);
  const connectWallet = () => setWalletModalVisible(true);

  const [isDrawerVisible, setIsDrawerVisible] = useState(undefined);
  const [isNativeSelectorModalVisible, setisNativeSelectorModalVisible] = useState(false);
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  const slideVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [savedSlippageAmount, setSavedSlippageAmount] = useLocalStorageSerializeKey(
    [chainId, SLIPPAGE_BPS_KEY],
    DEFAULT_SLIPPAGE_AMOUNT
  );
  const [slippageAmount, setSlippageAmount] = useState(0);
  const [slippageError, setSlippageError] = useState("");
  const [isPnlInLeverage, setIsPnlInLeverage] = useState(false);
  const [showPnlAfterFees, setShowPnlAfterFees] = useState(false);

  const MAX_DECIMALS = 2;

  const parseSlippageAmount = (amount) => {
    const strWithoutLeadingsZeroes = amount.replace(/^[0]+/g, "0");
    const decimals = strWithoutLeadingsZeroes.toString().split(".")[1];
    if (parseFloat(amount) > 5.0) {
      setSlippageError("Slippage should be less than 5%");
    } else if (decimals?.length > MAX_DECIMALS) {
      setSlippageError("Max slippage precision is 0.01%");
    }
    // limit the amount of decimals
    else if (!decimals || decimals?.length <= MAX_DECIMALS) {
      // replace commas with periods for other locales
      setSlippageAmount(strWithoutLeadingsZeroes.replace(/,/g, "."));
      setSlippageError("");
    }
    setSlippageAmount(amount);
  };

  const [savedIsPnlInLeverage, setSavedIsPnlInLeverage] = useLocalStorageSerializeKey(
    [chainId, IS_PNL_IN_LEVERAGE_KEY],
    false
  );

  const [savedShowPnlAfterFees, setSavedShowPnlAfterFees] = useLocalStorageSerializeKey(
    [chainId, SHOW_PNL_AFTER_FEES_KEY],
    false
  );

  const [savedShouldShowPositionLines, setSavedShouldShowPositionLines] = useLocalStorageSerializeKey(
    [chainId, SHOULD_SHOW_POSITION_LINES_KEY],
    false
  );

  const openSettings = () => {
    const slippage = parseInt(savedSlippageAmount);
    setSlippageAmount((slippage / BASIS_POINTS_DIVISOR) * 100);
    setIsPnlInLeverage(savedIsPnlInLeverage);
    setShowPnlAfterFees(savedShowPnlAfterFees);
    setIsSettingsVisible(true);
  };

  const showNetworkSelectorModal = (val) => {
    setisNativeSelectorModalVisible(val);
  };

  const saveAndCloseSettings = () => {
    if (slippageError === "") {
      const slippage = parseFloat(slippageAmount);
      if (isNaN(slippage)) {
        helperToast.error("Invalid slippage value");
        return;
      }
      if (slippage > 5) {
        helperToast.error("Slippage should be less than 5%");
        return;
      }

      const basisPoints = (slippage * BASIS_POINTS_DIVISOR) / 100;
      if (parseInt(basisPoints) !== parseFloat(basisPoints)) {
        helperToast.error("Max slippage precision is 0.01%");
        return;
      }

      setSavedIsPnlInLeverage(isPnlInLeverage);
      setSavedShowPnlAfterFees(showPnlAfterFees);
      setSavedSlippageAmount(basisPoints);
      setIsSettingsVisible(false);
    }
  };
  useEffect(() => {
    if (isDrawerVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => (document.body.style.overflow = "unset");
  }, [isDrawerVisible]);

  const [pendingTxns, setPendingTxns] = useState([]);

  useEffect(() => {
    const pendingTxnHashes = {};
    const checkPendingTxns = async () => {
      const updatedPendingTxns = [];
      for (let i = 0; i < pendingTxns.length; i++) {
        const pendingTxn = pendingTxns[i];
        // because the interval is 2 seconds, if the txn takes longer than 2 seconds there
        // is potential for the interval event que to trigger multiple success or error notifications
        if (pendingTxnHashes[pendingTxn.hash]) {
          continue;
        }
        const receipt = await library.getTransactionReceipt(pendingTxn.hash);
        pendingTxnHashes[pendingTxn.hash] = true;
        if (receipt) {
          if (receipt.status === 0) {
            const txUrl = getExplorerUrl(chainId) + "tx/" + pendingTxn.hash;
            helperToast.error(
              <div>
                Txn failed.{" "}
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View
                </a>
                <br />
              </div>
            );
          }
          if (receipt.status === 1 && pendingTxn.message) {
            const txUrl = getExplorerUrl(chainId) + "tx/" + pendingTxn.hash;
            helperToast.success(
              <div>
                {pendingTxn.message}{" "}
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View
                </a>
                <br />
              </div>
            );
          }
          continue;
        }
        updatedPendingTxns.push(pendingTxn);
      }

      if (updatedPendingTxns.length !== pendingTxns.length) {
        setPendingTxns(updatedPendingTxns);
      }
    };

    const interval = setInterval(() => {
      checkPendingTxns();
    }, 2 * 1000);
    return () => clearInterval(interval);
  }, [library, pendingTxns, chainId]);

  const vaultAddress = getContract(chainId, "Vault");
  const positionRouterAddress = getContract(chainId, "PositionRouter");

  useEffect(() => {
    const wsVaultAbi = chainId === ARBITRUM ? VaultV2.abi : VaultV2b.abi;
    const wsProvider = getWsProvider(active, chainId);
    if (!wsProvider) {
      return;
    }

    const wsVault = new ethers.Contract(vaultAddress, wsVaultAbi, wsProvider);
    const wsPositionRouter = new ethers.Contract(positionRouterAddress, PositionRouter.abi, wsProvider);

    const callExchangeRef = (method, ...args) => {
      if (!exchangeRef || !exchangeRef.current) {
        return;
      }

      exchangeRef.current[method](...args);
    };

    // handle the subscriptions here instead of within the Exchange component to avoid unsubscribing and re-subscribing
    // each time the Exchange components re-renders, which happens on every data update
    const onUpdatePosition = (...args) => callExchangeRef("onUpdatePosition", ...args);
    const onClosePosition = (...args) => callExchangeRef("onClosePosition", ...args);
    const onIncreasePosition = (...args) => callExchangeRef("onIncreasePosition", ...args);
    const onDecreasePosition = (...args) => callExchangeRef("onDecreasePosition", ...args);
    const onCancelIncreasePosition = (...args) => callExchangeRef("onCancelIncreasePosition", ...args);
    const onCancelDecreasePosition = (...args) => callExchangeRef("onCancelDecreasePosition", ...args);

    wsVault.on("UpdatePosition", onUpdatePosition);
    wsVault.on("ClosePosition", onClosePosition);
    wsVault.on("IncreasePosition", onIncreasePosition);
    wsVault.on("DecreasePosition", onDecreasePosition);
    wsPositionRouter.on("CancelIncreasePosition", onCancelIncreasePosition);
    wsPositionRouter.on("CancelDecreasePosition", onCancelDecreasePosition);

    return function cleanup() {
      wsVault.off("UpdatePosition", onUpdatePosition);
      wsVault.off("ClosePosition", onClosePosition);
      wsVault.off("IncreasePosition", onIncreasePosition);
      wsVault.off("DecreasePosition", onDecreasePosition);
      wsPositionRouter.off("CancelIncreasePosition", onCancelIncreasePosition);
      wsPositionRouter.off("CancelDecreasePosition", onCancelDecreasePosition);
    };
  }, [active, chainId, vaultAddress, positionRouterAddress]);

  const { data: tokenBalances } = useSWR(
    [`FullApp:getTokenBalances:${active}`, chainId, readerAddress, "getTokenBalances", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, ReaderV2, [tokenAddresses]),
    }
  );
  const { data: fundingRateInfo } = useSWR([active, chainId, readerAddress, "getFundingRates"], {
    fetcher: fetcher(library, ReaderV2, [vaultAddress, nativeTokenAddress, whitelistedTokenAddresses]),
  });

  const { infoTokens } = useInfoTokens(library, chainId, active, tokenBalances, fundingRateInfo);

  // Track user wallet connect
  useEffect(() => {
    const accountChanged = hasChangedAccount(account);
    if ((!loggedInTracked || accountChanged) && infoTokens) {
      const sendTrackLoginData = async () => {
        if (account && tokenBalances) {
          const { balanceData } = getBalanceAndSupplyData(tokenBalances);

          // Format MYC token balances from BigNumber to float
          const tokenDecimals = tokens.map((token) => token.decimals);
          let mlpBalances = {};
          Object.keys(balanceData).forEach((token, i) => {
            if (balanceData[token]) {
              const fieldName = `balance${formatTitleCase(token)}`;
              mlpBalances[fieldName] = parseFloat(formatAmount(balanceData[token], tokenDecimals[i], 4, true));
            }
          });

          // Format user ERC20 token balances from BigNumber to float
          const [userBalances] = getUserTokenBalances(infoTokens);

          trackLogin(chainId, mlpBalances, userBalances);
          setCurrentAccount(account);
          setLoggedInTracked(true); // Only track once
        }
      };
      sendTrackLoginData();
    }
  }, [account, chainId, tokenBalances, trackLogin, loggedInTracked, library, infoTokens, tokens]);

  const selectorLabel = getChainName(chainId);

  const onNetworkSelect = useCallback(
    (option) => {
      if (option.value === chainId) {
        return;
      }
      return switchNetwork(option.value, active);
    },
    [chainId, active]
  );

  return (
    <>
      <div
        className={cx("App ReferralsBannerActive", {
          "full-width": sidebarVisible,
        })}
      >
        {/* <div style={{ height: "56px" }} />
        <div
          className="banner"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 50,
            paddingTop: "12px",
            paddingBottom: "12px",
            width: "100%",
            textAlign: "center",
            backgroundColor: "rgba(251, 191, 36)",
            fontWeight: "bold",
            color: "black",
          }}
        >
          Please read this blog{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://mycelium.xyz/blog/the-future-of-mycelium"
            style={{ color: "black" }}
          >
            this blog post
          </a>
          , and close your positions.
        </div> */}
        {/* <div className="App-background-side-1"></div>
        <div className="App-background-side-2"></div>
        <div className="App-background"></div>
        <div className="App-background-ball-1"></div>
        <div className="App-background-ball-2"></div>
        <div className="App-highlight"></div> */}
        <div className={cx("App-content", { "full-width": sidebarVisible })}>
          {isDrawerVisible && (
            <AnimatePresence>
              {isDrawerVisible && (
                <motion.div
                  className="App-header-backdrop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeVariants}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsDrawerVisible(!isDrawerVisible)}
                ></motion.div>
              )}
            </AnimatePresence>
          )}
          {isNativeSelectorModalVisible && (
            <AnimatePresence>
              {isNativeSelectorModalVisible && (
                <motion.div
                  className="selector-backdrop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeVariants}
                  transition={{ duration: 0.2 }}
                  onClick={() => setisNativeSelectorModalVisible(!isNativeSelectorModalVisible)}
                ></motion.div>
              )}
            </AnimatePresence>
          )}
          <nav>
            <div className="App-header large default-container">
              <div className="App-header-container-left">
                {/* <Link
                  className="App-header-link-main"
                  to="/"
                  onClick={() =>
                    trackAction &&
                    trackAction("Button clicked", {
                      buttonName: "Mycelium Nav Logo",
                    })
                  }
                >
                  <img src={logoImg} className="big" alt="Mycelium Swaps Logo" />
                  <img src={logoSmallImg} className="small" alt="Mycelium Swaps Logo" />
                </Link> */}
              </div>
              <div className="App-header-container-right">
                {/* <AppHeaderLinks trackAction={trackAction} /> */}
                <a style={{ marginRight: "16px" }} href="https://mycelium.xyz">Mycelium Home</a>
                <AppHeaderUser
                  disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
                  openSettings={openSettings}
                  setActivatingConnector={setActivatingConnector}
                  walletModalVisible={walletModalVisible}
                  setWalletModalVisible={setWalletModalVisible}
                  showNetworkSelectorModal={showNetworkSelectorModal}
                  trackAction={trackAction}
                />
              </div>
            </div>
            <div className={cx("App-header small  default-container", { active: isDrawerVisible })}>
              <div
                className={cx("App-header-link-container", "App-header-top", {
                  active: isDrawerVisible,
                })}
              >
                <div className="App-header-container-left">
                  {/* <Link
                    className="App-header-link-main clickable"
                    to="/"
                    onClick={() => {
                      trackAction &&
                        trackAction("Button clicked", {
                          buttonName: "Mycelium Nav Logo",
                        });
                    }}
                  >
                    <img src={logoSmallImg} className="small" alt="Mycelium Swaps Logo" />
                    <img src={logoImg} className="big" alt="Mycelium Swaps Logo" />
                  </Link> */}
                </div>
                <div>
                  <div className="App-header-container-right">
                    {/* <AppHeaderLinks trackAction={trackAction} /> */}
                    {/* <LinkDropdown /> */}
                    <Link style={{ marginRight: "16px" }} href="https://mycelium.xyz">Mycelium Home</Link>
                    <AppHeaderUser
                      disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
                      openSettings={openSettings}
                      small
                      setActivatingConnector={setActivatingConnector}
                      walletModalVisible={walletModalVisible}
                      setWalletModalVisible={setWalletModalVisible}
                      showNetworkSelectorModal={showNetworkSelectorModal}
                      trackAction={trackAction}
                    />
                  </div>
                  {location?.pathname !== "/" && (
                    <div className="App-header-user-link Trade-btn-mobile">
                      <NavLink exact activeClassName="active" className="default-btn trade-link" to="/">
                        Trade
                      </NavLink>
                    </div>
                  )}
                  {/* <AppDropdown isMobile /> */}
                  {/* Hamburger menu */}
                  <button className="App-header-menu-icon-block" onClick={() => setIsDrawerVisible(!isDrawerVisible)}>
                    <span />
                    <span />
                    <span />
                  </button>
                </div>
              </div>
            </div>
          </nav>
          <div
            className={cx("App-header-links-container App-header-drawer", {
              closed: !isDrawerVisible,
            })}
          >
            <MobileLinks
              openSettings={openSettings}
              clickCloseIcon={() => setIsDrawerVisible(false)}
              trackAction={trackAction}
              networkOptions={networkOptions}
              selectorLabel={selectorLabel}
              onNetworkSelect={onNetworkSelect}
              setWalletModalVisible={setWalletModalVisible}
              showNetworkSelectorModal={showNetworkSelectorModal}
              disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
            />
          </div>
          <Switch>
            {/* <Route exact path="/">
              <Exchange
                ref={exchangeRef}
                savedShowPnlAfterFees={savedShowPnlAfterFees}
                savedIsPnlInLeverage={savedIsPnlInLeverage}
                setSavedIsPnlInLeverage={setSavedIsPnlInLeverage}
                savedSlippageAmount={savedSlippageAmount}
                setPendingTxns={setPendingTxns}
                pendingTxns={pendingTxns}
                savedShouldShowPositionLines={savedShouldShowPositionLines}
                setSavedShouldShowPositionLines={setSavedShouldShowPositionLines}
                connectWallet={connectWallet}
                infoTokens={infoTokens}
                trackPageWithTraits={trackPageWithTraits}
                trackAction={trackAction}
                analytics={analytics}
                sidebarVisible={sidebarVisible}
              />
            </Route>
            <Route exact path="/dashboard">
              <Dashboard />
            </Route>
            <Route exact path="/earn">
              <Stake
                setPendingTxns={setPendingTxns}
                connectWallet={connectWallet}
                trackAction={trackAction}
                trackPageWithTraits={trackPageWithTraits}
                analytics={analytics}
                infoTokens={infoTokens}
                savedSlippageAmount={savedSlippageAmount}
              />
            </Route> */}
            <Route path="*">
              <BuyMlp
                savedSlippageAmount={savedSlippageAmount}
                setPendingTxns={setPendingTxns}
                connectWallet={connectWallet}
                trackPageWithTraits={trackPageWithTraits}
                trackAction={trackAction}
                analytics={analytics}
              />
            </Route>
            {/* <Route exact path="/sell_mlp">
              <SellMlp
                savedSlippageAmount={savedSlippageAmount}
                setPendingTxns={setPendingTxns}
                connectWallet={connectWallet}
              />
            </Route>
            <Route exact path="/rewards">
              <Rewards
                connectWallet={connectWallet}
                trackPageWithTraits={trackPageWithTraits}
                trackAction={trackAction}
                analytics={analytics}
                infoTokens={infoTokens}
                setPendingTxns={setPendingTxns}
              />
            </Route>
            <Route exact path="/referrals">
              <Referrals
                connectWallet={connectWallet}
                trackPageWithTraits={trackPageWithTraits}
                trackAction={trackAction}
                analytics={analytics}
                infoTokens={infoTokens}
                pendingTxns={pendingTxns}
                setPendingTxns={setPendingTxns}
              />
            </Route> */}
            {/*
            <Route exact path="/nft_wallet">
              <NftWallet />
            </Route>
            */}
            {/* <Route exact path="/actions/:account">
              <Actions trackAction={trackAction} />
            </Route>
            <Route exact path="/orders_overview">
              <OrdersOverview />
            </Route>
            <Route exact path="/positions_overview">
              <PositionsOverview />
            </Route>
            <Route exact path="/actions">
              <Actions trackAction={trackAction} />
            </Route> */}
            {/*
            <Route exact path="/begin_account_transfer">
              <BeginAccountTransfer setPendingTxns={setPendingTxns} />
            </Route>
            <Route exact path="/complete_account_transfer/:sender/:receiver">
              <CompleteAccountTransfer setPendingTxns={setPendingTxns} />
            </Route>
            <Route exact path="/debug">
              <Debug />
            </Route>
            <Route exact path="/referral-terms">
              <ReferralTerms />
            </Route> */}
            {/* <Route path="*">
              <PageNotFound />
            </Route> */}
          </Switch>
        </div>
        {/* <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} /> */}
        {/* <Footer /> */}
      </div>
      <ToastContainer
        limit={3}
        transition={Zoom}
        position="bottom-right"
        autoClose={7000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        draggable={false}
        pauseOnHover
      />
      <EventToastContainer />
      {/* <EventModal
        isModalVisible={isEventModalVisible
        setEventModalVisible={setEventModalVisible}
        eventKey="seenPopupV4"
        hideHeader={true}
        requiresConfirmation={true}
      /> */}
      <Modal
        className="Connect-wallet-modal"
        isVisible={walletModalVisible}
        setIsVisible={setWalletModalVisible}
        label="Connect Wallet"
      >
        <button
          className="Wallet-btn MetaMask-btn"
          onClick={() => {
            activateMetaMask();
            trackAction && trackAction("Button clicked", { buttonName: "Connect with MetaMask" });
          }}
        >
          <img src={metamaskImg} alt="MetaMask" />
          <div>MetaMask</div>
        </button>
        <button
          className="Wallet-btn CoinbaseWallet-btn"
          onClick={() => {
            activateCoinBase();
            trackAction && trackAction("Button clicked", { buttonName: "Connect with Coinbase Wallet" });
          }}
        >
          <img src={coinbaseImg} alt="Coinbase Wallet" />
          <div>Coinbase Wallet</div>
        </button>
        <button
          className="Wallet-btn WalletConnect-btn"
          onClick={() => {
            activateWalletConnect();
            trackAction && trackAction("Button clicked", { buttonName: "Connect with WalletConnect" });
          }}
        >
          <img src={walletConnectImg} alt="WalletConnect" />
          <div>WalletConnect</div>
        </button>
      </Modal>
      <Modal
        className="Connect-wallet-modal"
        isVisible={walletModalVisible}
        setIsVisible={setWalletModalVisible}
        label="Connect Wallet"
      >
        <button
          className="Wallet-btn MetaMask-btn"
          onClick={() => {
            activateMetaMask();
            trackAction && trackAction("Button clicked", { buttonName: "Connect with MetaMask" });
          }}
        >
          <img src={metamaskImg} alt="MetaMask" />
          <div>MetaMask</div>
        </button>
        <button
          className="Wallet-btn CoinbaseWallet-btn"
          onClick={() => {
            activateCoinBase();
            trackAction && trackAction("Button clicked", { buttonName: "Connect with Coinbase Wallet" });
          }}
        >
          <img src={coinbaseImg} alt="Coinbase Wallet" />
          <div>Coinbase Wallet</div>
        </button>
        <button
          className="Wallet-btn WalletConnect-btn"
          onClick={() => {
            activateWalletConnect();
            trackAction && trackAction("Button clicked", { buttonName: "Connect with WalletConnect" });
          }}
        >
          <img src={walletConnectImg} alt="WalletConnect" />
          <div>WalletConnect</div>
        </button>
      </Modal>
      <Modal
        className="App-settings"
        isVisible={isSettingsVisible}
        setIsVisible={setIsSettingsVisible}
        label="Settings"
      >
        <div className="App-settings-row">
          <div>Allowed Slippage</div>
          <div className="App-slippage-tolerance-input-container">
            <input
              type="number"
              className="App-slippage-tolerance-input"
              step="0.01"
              min="0"
              value={slippageAmount}
              onChange={(e) => parseSlippageAmount(e.target.value)}
            />
            <div className="App-slippage-tolerance-input-percent">%</div>
          </div>
          {slippageError !== "" && <div className="App-slippage-tolerance-error">{slippageError}</div>}
        </div>
        <div className="Exchange-settings-row">
          <Checkbox isChecked={showPnlAfterFees} setIsChecked={setShowPnlAfterFees}>
            Display PnL after fees
          </Checkbox>
        </div>
        <div className="Exchange-settings-row">
          <Checkbox isChecked={isPnlInLeverage} setIsChecked={setIsPnlInLeverage}>
            Include PnL in leverage display
          </Checkbox>
        </div>
        <button
          className="App-cta Exchange-swap-button"
          onClick={() => {
            saveAndCloseSettings();
            trackAction &&
              trackAction("Button clicked", {
                buttonName: "Save wallet settings",
              });
          }}
        >
          Save
        </button>
      </Modal>
    </>
  );
}

function PreviewApp() {
  const [isDrawerVisible, setIsDrawerVisible] = useState(undefined);
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  const slideVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  return (
    <>
      <div className="App">
        <div className="App-background-side-1"></div>
        <div className="App-background-side-2"></div>
        <div className="App-background"></div>
        <div className="App-background-ball-1"></div>
        <div className="App-background-ball-2"></div>
        <div className="App-highlight"></div>
        <div className={cx("App-content", { "full-width": isDrawerVisible })}>
          {isDrawerVisible && (
            <AnimatePresence>
              {isDrawerVisible && (
                <motion.div
                  className="App-header-backdrop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeVariants}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsDrawerVisible(!isDrawerVisible)}
                ></motion.div>
              )}
            </AnimatePresence>
          )}
          <header>
            <div className="App-header large preview">
              <div className="App-header-container-left">
                <NavLink exact activeClassName="active" className="App-header-link-main" to="/">
                  <img src={logoImg} alt="Mycelium Swaps Logo" />
                  MYC
                </NavLink>
              </div>
            </div>
            <div className={cx("App-header", "small", { active: isDrawerVisible })}>
              <div
                className={cx("App-header-link-container", "App-header-top", {
                  active: isDrawerVisible,
                })}
              >
                <div className="App-header-container-left">
                  <div className="App-header-link-main">
                    <img src={logoImg} alt="Mycelium Swaps Logo" />
                  </div>
                </div>
                <div className="App-header-container-right">
                  <div onClick={() => setIsDrawerVisible(!isDrawerVisible)}>
                    {!isDrawerVisible && <RiMenuLine className="App-header-menu-icon" />}
                    {isDrawerVisible && <FaTimes className="App-header-menu-icon" />}
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {isDrawerVisible && (
                  <motion.div
                    onClick={() => setIsDrawerVisible(false)}
                    className="App-header-links-container App-header-drawer"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={slideVariants}
                    transition={{ duration: 0.2 }}
                  >
                    <AppHeaderLinks small />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>
        </div>
      </div>
    </>
  );
}

function App() {
  const [hasConsented, setConsented] = useState(false);

  useEffect(() => {
    const consentAcknowledged = localStorage.getItem("consentAcknowledged") === "true";
    setConsented(consentAcknowledged);
  }, []);

  if (inPreviewMode()) {
    return (
      <Web3ReactProvider getLibrary={getLibrary}>
        <LeaderboardProvider>
          <ThemeProvider>
            <PreviewApp />
          </ThemeProvider>
        </LeaderboardProvider>
      </Web3ReactProvider>
    );
  }

  return (
    <SWRConfig value={{ refreshInterval: 5000 }}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <LeaderboardProvider>
          <ThemeProvider>
            <FullApp />
          </ThemeProvider>
          <ConsentModal hasConsented={hasConsented} setConsented={setConsented} />
        </LeaderboardProvider>
      </Web3ReactProvider>
    </SWRConfig>
  );
}

export default App;
