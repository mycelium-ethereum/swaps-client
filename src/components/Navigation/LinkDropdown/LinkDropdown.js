import { useState, useEffect, useRef } from "react";
import { DropdownContainer, DropdownButton, LinkMenu, LinkItem } from "./LinkDropdown.styles";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import chevronDown from "../../../img/chevron-down.svg";
import { NavLink } from "react-router-dom";

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
    name: "Docs",
    path: "https://swaps.docs.mycelium.xyz/perpetual-swaps/mycelium-perpetual-swaps",
  },
];

export default function LinkDropdown() {
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
    const currentPage = navLinks.filter((item) => item.path === window.location.pathname)?.name;
    if (currentPage) {
      setCurrentItem(currentPage);
    } else {
      setCurrentItem("Home");
    }
  }, []);

  const containerRef = useRef(null);
  useOutsideClick(containerRef, handleClose);

  return (
    <DropdownContainer ref={containerRef}>
      <DropdownButton onClick={handleToggle}>
        {currentItem} <img src={chevronDown} alt="Close" />
      </DropdownButton>
      <LinkMenu open={isOpen}>
        {navLinks.map((item) => (
          <MenuItem key={item.name} onClick={handleLinkClick} path={item.path}>
            {item.name}
          </MenuItem>
        ))}
      </LinkMenu>
    </DropdownContainer>
  );
}

const MenuItem = ({ path, onClick, children }) => (
  <LinkItem>
    <NavLink activeClassName="active" exact to={path} onClick={() => onClick(children)}>
      {children}{" "}
    </NavLink>
  </LinkItem>
);
