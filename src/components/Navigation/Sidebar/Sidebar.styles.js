import styled from "styled-components";
import { ReactComponent as PullTabSvg } from "../../../img/nav/pull-tab.svg";

export const SideMenu = styled.aside(
  (props) => `
  font-family: "aileron", sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: fixed;
  left: 0;
  top: 0;
  background: var(--background-primary);
  width: 310px;
  height: 100vh;
  z-index: 999;
  box-shadow: 1px -6px 32px -12px rgba(9, 130, 0, 1);
  padding: 16px 0;
  transition: transform 0.5s ease, opacity 0.5s ease;
  transform: ${props.visible ? "translateX(-262px)" : "translateX(0)"};
  background: linear-gradient(83.12deg, rgba(9, 130, 0, 0.5) -208.54%, rgba(9, 130, 0, 0) 159.09%), rgba(0, 0, 0, 0.9);
  border-right: 1px solid var(--action-active);
  @media (max-width: 1380px) {
    opacity: 0;
    pointer-events: none;
    transform: translateX(-310px);
  }
`
);

export const Logo = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 40px;
  img {
    width: 280px;
  }
`;

export const NavMenu = styled.ul`
  padding: 0;
  padding-bottom: 40px;
`;

export const LegalMenu = styled.div`
  display: flex;
  padding-left: 16px;
  margin-bottom: 20px;
  a {
    transition: color 0.3s ease;
    margin-right: 20px;
    text-decoration: none;
    color: var(--action-active);

    &:hover {
      color: white;
    }
  }
`;
export const BottomMenuItem = styled.div`
  padding-bottom: 0;
  border-bottom: 1px solid var(--action-active);
  margin-bottom: 16px;
  a {
    display: flex;
    align-items: center;
    width: 100%;
    height: 48px;
    text-decoration: none;
    padding-left: 8px;
    transition: color 0.3s ease;
    > svg {
      margin-right: 8px;
    }
    color: var(--action-active);
    &:hover {
      color: white;
    }
  }
`;

export const MenuItem = styled.li(
  (props) => `
  list-style: none;
  padding-bottom: 0;
  border-top: 1px solid var(--action-active);
  &:last-of-type {
    border-bottom: 1px solid var(--action-active);
  }
  a {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 48px;
    text-decoration: none;
    padding-left: 8px;
    color: ${props.yellow ? "var(--light-green)" : "var(--action-active)"};
    transition: color 0.3s ease;
    &:before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(244.65deg, #098200 -3.32%, rgba(9, 130, 0, 0) 128.23%);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: -1;
    }
    &.active,
    &:hover {
      color: white;
    }
    &.active:before,
    &:hover:before {
      opacity: 1;
    }
    svg {
      margin-right: 8px;
    }
  }
  `
);
export const ExternalLinkIcon = styled.img`
  width: 16px;
  height: 16px;
  margin-left: 10px;
`;

export const SocialLinksMenu = styled.div`
  width: max-content;
  padding-left: 16px;
  margin-bottom: 20px;
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  a {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color 0.3s ease;
    color: var(--action-active);
    &:hover {
      color: white;
    }
  }
`;

export const PullTab = styled(PullTabSvg)(
  (props) => `
  position: absolute;
  left: 100%;
  top: 30px;
  transition: all 0.3s ease;
  color: ${props.visible ? "var(--action-active)" : "white"};
  transform: ${props.visible ? "rotate(180deg) translateX(13px)" : "rotate(0deg) translateX(1px)"};
  cursor: pointer;
  &:hover {
    color: var(--action-active);
  }
`
);

export const CopyrightYear = styled.span`
  display: block;
  margin-left: 16px;
  font-size: 14px;
  color: var(--action-active);
`;
