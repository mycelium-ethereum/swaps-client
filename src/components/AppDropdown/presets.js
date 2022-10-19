import { ReactComponent as Pools } from "../../img/nav/logos/pools.svg";
import { ReactComponent as Staking } from "../../img/nav/logos/staking.svg";
import { ReactComponent as TokenMigration } from "../../img/nav/logos/token-migration.svg";
import { ReactComponent as Twitter } from "../../img/nav/twitter.svg";
import { ReactComponent as GitHub } from "../../img/nav/github.svg";
import { ReactComponent as Discord } from "../../img/nav/discord.svg";
import { ReactComponent as Medium } from "../../img/nav/medium.svg";
import * as Links from "../../constants/links";

export const linkRowContent = [
  {
    url: Links.pools,
    title: "Perpetual Pools",
    icon: Pools,
    width: 126,
  },
  {
    url: Links.staking,
    title: "Staking",
    icon: Staking,
    width: 105,
  },
  {
    url: Links.migration,
    title: "Token Migration",
    icon: TokenMigration,
    width: 140,
  },
];

export const socialLinks = [
  {
    url: Links.twitter,
    icon: Twitter,
    title: "Twitter",
    className: "w-[17px] h-[15px]",
  },
  {
    url: Links.github,
    icon: GitHub,
    title: "GitHub",
    className: "w-[17px] h-[17px]",
  },
  {
    url: Links.discord,
    icon: Discord,
    title: "Discord",
    className: "w-5 h-4",
  },
  {
    url: Links.medium,
    icon: Medium,
    title: "Medium",
    className: "w-[23px] h-[14px]",
  },
];
