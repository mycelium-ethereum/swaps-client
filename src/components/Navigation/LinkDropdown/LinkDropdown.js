import { useState, useEffect, useRef } from "react";
import { DropdownContainer, LinkDropdownButton, LinkMenu, ListItem } from "../Dropdown.styles";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import chevronDown from "../../../img/chevron-down.svg";
import { NavLink, useLocation } from "react-router-dom";
import { Text } from "../../Translation/Text";

const navLinks = [
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

export default function LinkDropdown() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const handleLinkClick = (item) => {
    setCurrentItem(item);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const currentPage = navLinks.filter((item) => item.path === location.pathname)[0]?.name || "Trade";
    setCurrentItem(currentPage);
  }, [location]);

  const containerRef = useRef(null);
  useOutsideClick(containerRef, handleClose);

  return (
    <DropdownContainer ref={containerRef}>
      <LinkDropdownButton onClick={handleToggle}>
        <Text>{currentItem}</Text> <img src={chevronDown} alt="Close" />
      </LinkDropdownButton>
      <LinkMenu open={isOpen}>
        {navLinks.map((item) => (
          <MenuItem key={item.name} onClick={handleLinkClick} path={item.path}>
            {item.name}
          </MenuItem>
        ))}
        <ListItem>
          <a href="https://stake.mycelium.xyz" target="_blank" rel="noopener noreferrer">
            MYC <Text>Staking</Text>
          </a>
        </ListItem>
        <ListItem>
          <a href="https://analytics.mycelium.xyz" target="_blank" rel="noopener noreferrer">
            <Text>Analytics</Text>
          </a>
        </ListItem>
        <ListItem>
          <a
            href="https://swaps.docs.mycelium.xyz/perpetual-swaps/mycelium-perpetual-swaps"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Text>Docs</Text>
          </a>
        </ListItem>
      </LinkMenu>
    </DropdownContainer>
  );
}

const MenuItem = ({ path, onClick, children }) => (
  <ListItem>
    <NavLink activeClassName="active" exact to={path} onClick={() => onClick(children)}>
      <Text>{children}</Text>
    </NavLink>
  </ListItem>
);
