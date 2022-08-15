import React, { useEffect } from "react";
import { AppHeaderLinkContainer, MyceliumCopy, HeaderClose, Header } from "./MobileNav.styles";

import { NavLink } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";

import navClose from "../../img/ic_nav_close.svg";

export default function AppHeaderLinks({ openSettings, clickCloseIcon, setWalletModalVisible }) {
  const { active } = useWeb3React();

  useEffect(() => {
    if (active) {
      setWalletModalVisible(false);
    }
  }, [active, setWalletModalVisible]);

  return (
    <div className="App-header-links">
      <Header>
        <div>Menu</div>
        <HeaderClose onClick={() => clickCloseIcon()}>
          Close
          <img src={navClose} className="close-icon" alt="Close icon" />
        </HeaderClose>
      </Header>
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
          href="https://tracer-1.gitbook.io/tracer-perpetual-swaps/6VOYVKGbCCw0I8cj7vdF/perpetual-swaps/tracers-perpetual-swaps"
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
