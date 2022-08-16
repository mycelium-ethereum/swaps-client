import React, { useEffect } from "react";
import AddressDropdown from "../AddressDropdown/AddressDropdown";
import { ConnectWalletButton } from "../Common/Button";
import NetworkSelector from "../NetworkSelector/NetworkSelector";
import {
  AppHeaderLinkContainer,
  MyceliumCopy,
  HeaderClose,
  Header,
  SwitchButton,
  NavBackground,
  AccountDropdownContainer,
  MobileNavMenu,
  NetworkDropdownContainer,
  ScrollContainer,
} from "./MobileNav.styles";

import { NavLink } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import { useChainId, getAccountUrl } from "../../Helpers";
import navClose from "../../img/ic_nav_close.svg";
import poolsSmallImg from "../../img/myc_pools_short.svg";
import mobileMeshBackground from "../../img/background_mesh_mobile.png";
import connectWalletImg from "../../img/ic_wallet_24.svg";

export default function AppHeaderLinks({
  openSettings,
  clickCloseIcon,
  setWalletModalVisible,
  trackAction,
  disconnectAccountAndCloseSettings,
  networkOptions,
  selectorLabel,
  onNetworkSelect,
  showNetworkSelectorModal,
}) {
  const { chainId } = useChainId();
  const { active, account } = useWeb3React();

  useEffect(() => {
    if (active) {
      setWalletModalVisible(false);
    }
  }, [active, setWalletModalVisible]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1380) {
        clickCloseIcon();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [clickCloseIcon]);

  const accountUrl = getAccountUrl(chainId, account);

  return (
    <MobileNavMenu>
      <NavBackground src={mobileMeshBackground} alt="" />
      <ScrollContainer>
        <div>
          <Header>
            <span>Menu</span>
            <HeaderClose onClick={() => clickCloseIcon()}>
              <span>Close</span>
              <img src={navClose} className="close-icon" alt="Close icon" />
            </HeaderClose>
          </Header>
          <a
            href="https://pools.mycelium.xyz"
            rel="noopener noreferrer"
            target="_blank"
            className="pools-link"
            onClick={() => trackAction && trackAction("Button clicked", { buttonName: "Switch to Perpetual Pools" })}
          >
            <SwitchButton className="default-btn switch-link">
              Switch to <img src={poolsSmallImg} alt="Perpetual Pools" />
            </SwitchButton>
          </a>
          <AccountDropdownContainer>
            {active ? (
              <AddressDropdown
                account={account}
                small={false}
                accountUrl={accountUrl}
                disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
                openSettings={openSettings}
                trackAction={trackAction}
              />
            ) : (
              <ConnectWalletButton
                onClick={() => {
                  trackAction && trackAction("Button clicked", { buttonName: "Connect Wallet" });
                  setWalletModalVisible(true);
                }}
                imgSrc={connectWalletImg}
              >
                Connect Wallet
              </ConnectWalletButton>
            )}
          </AccountDropdownContainer>
          <NetworkDropdownContainer>
            <NetworkSelector
              options={networkOptions}
              label={selectorLabel}
              onSelect={onNetworkSelect}
              className="App-header-user-netowork"
              showCaret={false}
              modalLabel="Select Network"
              small={true}
              showModal={showNetworkSelectorModal}
              trackAction={trackAction}
              isMobileNav
            />
          </NetworkDropdownContainer>
        </div>
        <div>
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
            <NavLink activeClassName="active" to="/buy_mlp">
              Buy
            </NavLink>
          </AppHeaderLinkContainer>
          <AppHeaderLinkContainer>
            <NavLink activeClassName="active" to="/rewards">
              Rewards
            </NavLink>
          </AppHeaderLinkContainer>
          <AppHeaderLinkContainer>
            <a
              href="https://swaps.docs.mycelium.xyz/perpetual-swaps/mycelium-perpetual-swaps"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
          </AppHeaderLinkContainer>
          <AppHeaderLinkContainer>
            {/* eslint-disable-next-line */}
            <a href="#" onClick={openSettings}>
              Settings
            </a>
          </AppHeaderLinkContainer>
          <MyceliumCopy>© 2022 Mycelium</MyceliumCopy>
        </div>
      </ScrollContainer>
    </MobileNavMenu>
  );
}
