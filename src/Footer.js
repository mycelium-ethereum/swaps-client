import React from "react";

import "./Footer.css";
import { Footer as TracerFooter } from '@tracer-protocol/tracer-ui';

// import logoImg from "./img/ic_gmx_footer.svg";
// import twitterIcon from "./img/ic_twitter.svg";
// import discordIcon from "./img/ic_discord.svg";
// import telegramIcon from "./img/ic_telegram.svg";
// import githubIcon from "./img/ic_github.svg";
// import mediumIcon from "./img/ic_medium.svg";
// import { NavLink } from "react-router-dom";

export default function Footer() {
  return (
    <TracerFooter className="TracerFooter" />
  );
}
