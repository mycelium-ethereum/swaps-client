import { SideMenu, Logo, NavMenu, MenuItem, SocialLinksMenu, PullTab, LegalMenu } from "./Sidebar.styles";
import { NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaArrowUp,
  FaShoppingCart,
  FaAward,
  FaBook,
  FaCoins,
  FaFile,
  FaLayerGroup,
  FaSync,
} from "react-icons/fa";

import logoImg from "../../../img/logo_MYC.svg";
import gitbookIcon from "../../../img/gitbook.svg";
import twitterIcon from "../../../img/twitter.svg";
import githubIcon from "../../../img/github.svg";
import arrowLeftIcon from "../../../img/arrow-left.svg";
import discordIcon from "../../../img/discord.svg";

const navLinks = [
  {
    name: "Trade",
    path: "/",
    icon: FaCoins,
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: FaChartLine,
  },
  {
    name: "Earn",
    path: "/earn",
    icon: FaArrowUp,
  },
  {
    name: "Buy",
    path: "/buy_mlp",
    icon: FaShoppingCart,
  },
  {
    name: "Rewards",
    path: "/rewards",
    icon: FaAward,
  },
  // {
    // name: "Referrals",
    // path: "/referrals",
    // icon: FaSync,
  // },
  {
    name: "Docs",
    path: "https://swaps.docs.mycelium.xyz/perpetual-swaps/mycelium-perpetual-swaps",
    icon: FaBook,
  },
];

const legalLinks = [
  {
    name: "Privacy Policy",
    path: "https://mycelium.xyz/privacy-policy",
    icon: FaLayerGroup,
  },
  {
    name: "Terms of Use",
    path: "https://mycelium.xyz/terms-of-use",
    icon: FaFile,
  },
];
const socialLinks = [
  {
    name: "GitBook",
    path: "https://swaps.docs.mycelium.xyz/",
    icon: gitbookIcon,
  },
  {
    name: "Twitter",
    path: "https://twitter.com/mycelium_xyz",
    icon: twitterIcon,
  },
  {
    name: "Github",
    path: "https://github.com/mycelium-ethereum",
    icon: githubIcon,
  },
  {
    name: "Discord",
    path: "https://discord.gg/mycelium-xyz",
    icon: discordIcon,
  },
];

export default function Sidebar({ sidebarVisible, setSidebarVisible }) {
  return (
    <SideMenu visible={sidebarVisible}>
      <PullTab visible={sidebarVisible} onClick={() => setSidebarVisible(!sidebarVisible)}>
        <img src={arrowLeftIcon} alt="Close" />
      </PullTab>
      <Logo>
        <NavLink exact className="App-header-link-main" to="/">
          <img src={logoImg} alt="Tracer Logo" />
        </NavLink>
      </Logo>
      <div>
        <NavMenu>
          {navLinks.slice(0, navLinks.length - 1).map((item) => (
            <MenuItem key={item.name}>
              <NavLink activeClassName="active" exact className="App-header-link-main" to={item.path}>
                <item.icon /> {item.name}
              </NavLink>
            </MenuItem>
          ))}
          <MenuItem>
            <a
              href="https://swaps.docs.mycelium.xyz/perpetual-swaps/mycelium-perpetual-swaps"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaBook /> Docs
            </a>
          </MenuItem>
        </NavMenu>
        <LegalMenu>
          {legalLinks.map((item) => (
            <MenuItem key={item.name}>
              <a href={item.path} target="_blank" rel="noopener noreferrer">
                <item.icon /> {item.name}
              </a>
            </MenuItem>
          ))}
        </LegalMenu>
      </div>
      <SocialLinksMenu>
        {socialLinks.map((item) => (
          <MenuItem key={item.name}>
            <a href={item.path} target="_blank" rel="noopener noreferrer">
              <img src={item.icon} alt={item.name} />
            </a>
          </MenuItem>
        ))}
      </SocialLinksMenu>
    </SideMenu>
  );
}
