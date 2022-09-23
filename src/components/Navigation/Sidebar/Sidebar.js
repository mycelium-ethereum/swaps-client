import {
  SideMenu,
  Logo,
  NavMenu,
  MenuItem,
  SocialLinksMenu,
  PullTab,
  LegalMenu,
  ExternalLinkIcon,
} from "./Sidebar.styles";
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
  FaChartBar,
  FaSync,
  FaFileInvoiceDollar,
} from "react-icons/fa";

import logoImg from "../../../img/logo_MYC.svg";
import gitbookIcon from "../../../img/gitbook.svg";
import twitterIcon from "../../../img/twitter.svg";
import githubIcon from "../../../img/github.svg";
import arrowLeftIcon from "../../../img/arrow-left.svg";
import discordIcon from "../../../img/discord.svg";
import externalLinkIcon from "../../../img/external-link.svg";

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
  {
    name: "Referrals",
    path: "/referrals",
    icon: FaSync,
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
          {navLinks.map((item) => (
            <MenuItem key={item.name}>
              <NavLink activeClassName="active" exact className="App-header-link-main" to={item.path}>
                <item.icon /> {item.name}
              </NavLink>
            </MenuItem>
          ))}
          <MenuItem>
            <a href="https://lend.mycelium.xyz" target="_blank" rel="noopener noreferrer">
              <FaFileInvoiceDollar /> Lending <ExternalLinkIcon src={externalLinkIcon} />
            </a>
          </MenuItem>
        </NavMenu>
        <LegalMenu>
          <MenuItem>
            <a href="https://analytics.mycelium.xyz" target="_blank" rel="noopener noreferrer">
              <FaChartBar /> Analytics <ExternalLinkIcon src={externalLinkIcon} />
            </a>
          </MenuItem>
          <MenuItem>
            <a
              href="https://swaps.docs.mycelium.xyz/perpetual-swaps/mycelium-perpetual-swaps"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaBook /> Docs <ExternalLinkIcon src={externalLinkIcon} />
            </a>
          </MenuItem>
          {legalLinks.map((item) => (
            <MenuItem key={item.name}>
              <a href={item.path} target="_blank" rel="noopener noreferrer">
                <item.icon /> {item.name} <ExternalLinkIcon src={externalLinkIcon} />
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
