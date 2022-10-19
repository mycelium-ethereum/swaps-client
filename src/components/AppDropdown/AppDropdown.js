import { useEffect, useRef, useState } from "react";
import cx from "classnames";
import * as Styles from "./AppDropdown.styles";
// import { Button } from "~/components/General/Button";
import { useOutsideClick } from "../../hooks/useOutsideClick";
// import { OutgoingLink } from "~/components/General/OutgoingLink";
import { linkRowContent, socialLinks } from "./presets";
// import { socialLinks } from "~/constants/socials";

const TABLET_BREAKPOINT = 768;
// const MOBILE_BREAKPOINT = 640;

export default function AppDropdown() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleClose = () => {
    setDropdownOpen(false);
  };

  const handleOpen = () => {
    setDropdownOpen(true);
  };

  const handleResize = () => {
    if (window.innerWidth < TABLET_BREAKPOINT) setDropdownOpen(false);
  };

  const containerRef = useRef(null);
  useOutsideClick(containerRef, handleClose);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Styles.DropdownContainer ref={containerRef}>
      <DropdownButton onClick={handleOpen} dropdownOpen={dropdownOpen} />
      <DropdownContent dropdownOpen={dropdownOpen} />
    </Styles.DropdownContainer>
  );
}

const DropdownButton = ({ dropdownOpen, onClick }) => (
  <Styles.DropdownButton onClick={onClick} dropdownOpen={dropdownOpen}>
    <Styles.ButtonText>Trade Now</Styles.ButtonText>
    <Styles.ChevronDown title="Chevron down" />
    <Styles.DropdownButtonBackground />
  </Styles.DropdownButton>
);

const DropdownContent = ({ dropdownOpen }) => (
  <Styles.DropdownContent dropdownOpen={dropdownOpen}>
    {linkRowContent.map((item) => (
      <LinkWrapper key={item.title} link={item.url}>
        <DropdownItem>
          <item.icon title={item.title} width={item.width} />
        </DropdownItem>
      </LinkWrapper>
    ))}
    <DropdownItem isSocialRow>
      <Styles.SocialsRow>
        {socialLinks.map((item) => (
          <Styles.OutgoingLink key={item.title} href={item.url}>
            <item.icon title={item.title} width={item.width} />
          </Styles.OutgoingLink>
        ))}
      </Styles.SocialsRow>
    </DropdownItem>
  </Styles.DropdownContent>
);

const DropdownItem = ({ isSocialRow, children }) => (
  <Styles.DropdownItem isSocialRow={isSocialRow}>
    <Styles.RelativeContainer>{children}</Styles.RelativeContainer>
    <Styles.ItemHoverBackground />
  </Styles.DropdownItem>
);

const LinkWrapper = ({ link, children }) => <Styles.OutgoingLink href={link}>{children}</Styles.OutgoingLink>;
