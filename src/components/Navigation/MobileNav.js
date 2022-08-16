import React, { useEffect } from "react";
import AddressDropdown from "../AddressDropdown/AddressDropdown";
import {
  AppHeaderLinkContainer,
  MyceliumCopy,
  HeaderClose,
  Header,
  SwitchButton,
  NavBackground,
} from "./MobileNav.styles";

import { NavLink } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";

import navClose from "../../img/ic_nav_close.svg";
import poolsSmallImg from "../../img/myc_pools_short.svg";
import mobileMeshBackground from "../../img/background_mesh_mobile.png";

export default function AppHeaderLinks({
  openSettings,
  clickCloseIcon,
  setWalletModalVisible,
  trackAction,
  account,
  accountUrl,
  disconnectAccountAndCloseSettings,
}) {
  console.log({
    openSettings,
    clickCloseIcon,
    setWalletModalVisible,
    trackAction,
    account,
    accountUrl,
    disconnectAccountAndCloseSettings,
  });
  const { active } = useWeb3React();

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

  return (
    <div className="App-header-links">
      <NavBackground src={mobileMeshBackground} alt="" />
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
        onClick={() => trackAction && trackAction("Button clicked", { buttonName: "Switch to Perpetual Pools" })}
      >
        <SwitchButton className="default-btn switch-link">
          Switch to <img src={poolsSmallImg} alt="Perpetual Pools" />
        </SwitchButton>
      </a>
      {/* <AddressDropdown
        account={account}
        small={true}
        accountUrl={accountUrl}
        disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
        openSettings={openSettings}
        trackAction={trackAction}
      /> */}
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
  );
}
