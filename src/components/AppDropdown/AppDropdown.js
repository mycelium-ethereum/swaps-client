import { useRef, useState } from "react";
import * as Styles from "./AppDropdown.styles";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { linkRowContent, socialLinks } from "./presets";

export default function AppDropdown({ isMobile }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleClose = () => {
    setDropdownOpen(false);
  };

  const handleOpen = () => {
    setDropdownOpen(true);
  };

  const containerRef = useRef(null);
  useOutsideClick(containerRef, handleClose);

  return (
    <Styles.DropdownContainer ref={containerRef} isMobile={isMobile}>
      <DropdownButton onClick={handleOpen} dropdownOpen={dropdownOpen} />
      <DropdownContent dropdownOpen={dropdownOpen} />
    </Styles.DropdownContainer>
  );
}

const DropdownButton = ({ dropdownOpen, onClick }) => (
  <Styles.DropdownButton onClick={onClick} dropdownOpen={dropdownOpen}>
    <Styles.MyceliumIcon title="Mycelium icon" />
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
