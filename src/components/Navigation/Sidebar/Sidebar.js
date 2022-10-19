import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  MenuContainer,
  SideMenu,
  Logo,
  NavMenu,
  MenuItem,
  BottomMenuItem,
  PullTab,
  SocialLinksMenu,
  CopyrightYear,
  LegalMenu,
  FixedContainer,
  EventBox,
  EventHeader,
  EventContent,
  EventGraphic,
  ViewNowButton,
  EventDescription,
  EventTitle,
} from "./Sidebar.styles";

import { ReactComponent as TradeIcon } from "../../../img/nav/trade.svg";
import { ReactComponent as DashboardIcon } from "../../../img/nav/dashboard.svg";
import { ReactComponent as EarnIcon } from "../../../img/nav/earn.svg";
import { ReactComponent as BuyIcon } from "../../../img/nav/buy.svg";
import { ReactComponent as RewardsIcon } from "../../../img/nav/rewards.svg";
import { ReactComponent as ReferralsIcon } from "../../../img/nav/referrals.svg";
import { ReactComponent as MycStakingIcon } from "../../../img/nav/myc-staking.svg";
// import { ReactComponent as LeaderboardIcon } from "../../../img/nav/trading-leaderboard.svg";
import { ReactComponent as AnalyticsIcon } from "../../../img/nav/analytics.svg";
import { ReactComponent as DocsIcon } from "../../../img/nav/docs.svg";
import { ReactComponent as GithubIcon } from "../../../img/nav/github.svg";
import { ReactComponent as TwitterIcon } from "../../../img/nav/twitter.svg";
import { ReactComponent as DiscordIcon } from "../../../img/nav/discord.svg";
import { ReactComponent as PullTabSvg } from "../../../img/nav/pull-tab.svg";
// import { ReactComponent as TranslateIcon } from "../../../img/nav/translate.svg";
import graphic from "../../../img/nav/event-graphic.png";

import logoImg from "../../../img/logo_MYC.svg";

const navTopLinks = [
  {
    name: "Trade",
    path: "/",
    icon: TradeIcon,
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: DashboardIcon,
  },
  {
    name: "Earn",
    path: "/earn",
    icon: EarnIcon,
  },
  {
    name: "Buy",
    path: "/buy_mlp",
    icon: BuyIcon,
  },
  {
    name: "Rewards",
    path: "/rewards",
    icon: RewardsIcon,
  },
  {
    name: "Referrals",
    path: "/referrals",
    icon: ReferralsIcon,
  },
];

const socialLinks = [
  {
    name: "Twitter",
    path: "https://twitter.com/mycelium_xyz",
    icon: TwitterIcon,
  },
  {
    name: "Github",
    path: "https://github.com/mycelium-ethereum",
    icon: GithubIcon,
  },
  {
    name: "Discord",
    path: "https://discord.gg/mycelium-xyz",
    icon: DiscordIcon,
  },
];

export default function Sidebar({ sidebarVisible, setSidebarVisible }) {
  const yearRef = useRef(null);

  const setYear = () => {
    const year = new Date().getFullYear();
    yearRef.current.innerHTML = `&copy; ${year} Mycelium`;
  };

  useEffect(() => {
    setYear();
  }, []);

  const openSidebar = () => {
    setSidebarVisible(true);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <FixedContainer>
      <PullTab visible={sidebarVisible} onClick={toggleSidebar}>
        <PullTabSvg />
      </PullTab>
      <SideMenu visible={sidebarVisible}>
        <Logo visible={sidebarVisible}>
          <NavLink exact className="App-header-link-main" to="/">
            <img src={logoImg} alt="Perpetual Swaps Logo" />
          </NavLink>
        </Logo>
        <MenuContainer onMouseEnter={closeSidebar} onMouseLeave={openSidebar}>
          <NavMenu>
            {navTopLinks.map((item) => (
              <MenuItem key={item.name}>
                <NavLink activeClassName="active" exact className="App-header-link-main" to={item.path}>
                  <item.icon /> <span>{item.name}</span>
                </NavLink>
              </MenuItem>
            ))}
            <MenuItem>
              <a href="https://stake.mycelium.xyz" target="_blank" rel="noopener noreferrer">
                <MycStakingIcon /> <span>MYC Staking</span>
              </a>
            </MenuItem>
          </NavMenu>
          <div>
            <NavMenu noPadding>
              <MenuItem yellow>
                <a href="https://analytics.mycelium.xyz" target="_blank" rel="noopener noreferrer">
                  <AnalyticsIcon /> <span>Analytics</span>
                </a>
              </MenuItem>
            </NavMenu>
            <EventBox>
              <EventHeader>WHAT'S HAPPENING THIS WEEK</EventHeader>
              <EventContent>
                <EventGraphic src={graphic} />
                <EventTitle>Driving volume to drive rewards</EventTitle>
                <EventDescription>Transparent, Cheap Perpetual Swap Trading Costs</EventDescription>
                <a
                  href="https://mycelium.xyz/blog/mycelium-s-fee-update-driving-volume-to-drive-rewards"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ViewNowButton>View Now</ViewNowButton>
                </a>
              </EventContent>
            </EventBox>
            <BottomMenuItem>
              <a
                href="https://swaps.docs.mycelium.xyz/perpetual-swaps/mycelium-perpetual-swaps"
                target="_blank"
                rel="noopener noreferrer"
              >
                <DocsIcon /> Docs
              </a>
            </BottomMenuItem>
            <SocialLinksMenu>
              {socialLinks.map((item) => (
                <a href={item.path} target="_blank" rel="noopener noreferrer">
                  <item.icon title={item.name} />
                </a>
              ))}
            </SocialLinksMenu>
            <LegalMenu>
              <a href="https://mycelium.xyz/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
              <a href="https://mycelium.xyz/terms-of-use" target="_blank" rel="noopener noreferrer">
                Terms of Use
              </a>
            </LegalMenu>
            <CopyrightYear ref={yearRef} />
          </div>
        </MenuContainer>
      </SideMenu>
    </FixedContainer>
  );
}
