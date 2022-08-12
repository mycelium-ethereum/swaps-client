import React, { useCallback, useEffect } from "react";
import {
  AppHeaderLinkContainer,
  PoolsSwitch,
  MobileNetworkSelector,
  MobileAddressDropdown,
  AddressDropdownContainer
} from './MobileNav.styles';

import mycSwapsLogo from "../../img/myc_swaps.svg";
import mycPoolsLogo from "../../img/myc_pools.svg";
import mycPoolsSwitch from "../../img/myc_pools_switch.svg";
import AddressDropdown from "../AddressDropdown/AddressDropdown";


import { Link, NavLink } from "react-router-dom";

import { 
  ARBITRUM,
  ARBITRUM_TESTNET,
  getAccountUrl,
  getChainName,
  switchNetwork,
  useChainId,
} from '../../Helpers';

import { FiX } from "react-icons/fi";

// import "./App.css";

import logoImg from "../../img/logo_MYC.svg";
import Button from "../Common/Button";
import { useWeb3React } from "@web3-react/core";

export default function AppHeaderLinks({ 
  openSettings,
  clickCloseIcon,
  trackAction,
  setWalletModalVisible,
  disconnectAccountAndCloseSettings
}) {

  const { chainId } = useChainId();
  const { active, account } = useWeb3React();
  const showSelector = true;
  const networkOptions = [
    {
      label: "Arbitrum",
      value: ARBITRUM,
      icon: "ic_arbitrum_24.svg",
      color: "#264f79",
    },
    {
      label: "Testnet",
      value: ARBITRUM_TESTNET,
      icon: "ic_arbitrum_24.svg",
      color: "#264f79",
    },
    // {
    // label: "Avalanche",
    // value: AVALANCHE,
    // icon: "ic_avalanche_24.svg",
    // color: "#E841424D",
    // },
  ];

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

  const accountUrl = getAccountUrl(chainId, account);

  return (
    <div className="App-header-links">
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
                buttonName: "Tracer Nav Logo",
              })
            }
          >
            <img src={logoImg} alt="Tracer TRS Logo" />
          </Link>
        </div>
      <PoolsSwitch>
        <Button>
          <span>
            Switch to
          </span>
          <img src={mycPoolsSwitch} />
        </Button>
      </PoolsSwitch>
      <MobileNetworkSelector
        options={networkOptions}
        label={selectorLabel}
        onSelect={onNetworkSelect}
        className="App-header-user-netowork"
        showCaret={true}
        modalLabel="Select Network"
        small={false}
        showModal={false}
        trackAction={trackAction}
      />
      <AddressDropdownContainer>
        <AddressDropdown
            account={account}
            small={false}
            accountUrl={accountUrl}
            disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
            openSettings={openSettings}
            trackAction={trackAction}
        />
      </AddressDropdownContainer>
      <AppHeaderLinkContainer>
        <NavLink activeClassName="active" to="/trade">
          <img src={mycSwapsLogo} />
        </NavLink>
      </AppHeaderLinkContainer>
      <AppHeaderLinkContainer>
        <NavLink activeClassName="active" to="/trade">
          <img src={mycSwapsLogo} />
        </NavLink>
      </AppHeaderLinkContainer>
      <AppHeaderLinkContainer>
        <NavLink activeClassName="active" to="/dashboard">
          Dashboard
        </NavLink>
      </AppHeaderLinkContainer>
      <AppHeaderLinkContainer>
        <NavLink activeClassName="active" to="/earn">
          Earn 
        </NavLink>
      </AppHeaderLinkContainer>
      <AppHeaderLinkContainer>
        <NavLink activeClassName="active" to="/Buy">
          Buy
        </NavLink>
      </AppHeaderLinkContainer>
      <AppHeaderLinkContainer>
        <NavLink activeClassName="active" to="/Rewards">
          Rewards 
        </NavLink>
      </AppHeaderLinkContainer>
      <AppHeaderLinkContainer>
        <a
          href="https://tracer-1.gitbook.io/tracer-perpetual-swaps/6VOYVKGbCCw0I8cj7vdF/perpetual-swaps/tracers-perpetual-swaps"
          target="_blank"
          rel="noopener noreferrer"
        >
          Docs
        </a>
      </AppHeaderLinkContainer>
      <div className="App-header-link-container">
        {/* eslint-disable-next-line */}
        <a href="#" onClick={openSettings}>
          Settings
        </a>
      </div>
    </div>
  );
}
