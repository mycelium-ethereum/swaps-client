import React, { useEffect, useRef } from "react";
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
  FlexContainer,
} from "./MobileNav.styles";

import { NavLink } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import { useChainId, getAccountUrl } from "../../Helpers";
import navClose from "../../img/ic_nav_close.svg";
import poolsSmallImg from "../../img/myc_pools_short.svg";
import mobileMeshBackground from "../../img/background_mesh_mobile.png";
import connectWalletImg from "../../img/ic_wallet_24.svg";

const navLinks = [
  {
    name: "Trade",
    path: "/",
  },
  {
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    name: "Earn",
    path: "/earn",
  },
  {
    name: "Buy",
    path: "/buy_mlp",
  },
  {
    name: "Rewards",
    path: "/rewards",
  },
  {
    name: "Referrals",
    path: "/referrals",
  },
];

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

  const yearRef = useRef(null);

  useEffect(() => {
    if (active) {
      setWalletModalVisible(false);
    }
  }, [active, setWalletModalVisible]);

  useEffect(() => {
    const year = new Date().getFullYear();
    yearRef.current.innerHTML = year.toString();
    const handleResize = () => {
      if (window.innerWidth > 670) {
        clickCloseIcon();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [yearRef, clickCloseIcon]);

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
          <FlexContainer>
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
                  Connect
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
          </FlexContainer>
        </div>
        <div>
          {/* {navLinks.map((navLink) => (
            <AppHeaderLinkContainer key={navLink.name}>
              <NavLink activeClassName="active" to={navLink.path} onClick={clickCloseIcon}>
                {navLink.name}
              </NavLink>
            </AppHeaderLinkContainer>
          ))} */}
          <AppHeaderLinkContainer>
            <a href="https://mycelium.xyz">
              Mycelium Home
            </a>
          </AppHeaderLinkContainer>
          <MyceliumCopy>
            © <span ref={yearRef} /> Mycelium
          </MyceliumCopy>
        </div>
      </ScrollContainer>
    </MobileNavMenu>
  );
}
