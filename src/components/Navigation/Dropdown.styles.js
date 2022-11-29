import styled from "styled-components";

export const DropdownContainer = styled.div(
  (props) => `
  position: relative;
  @media (min-width: 700px) {
    display: ${props.isMobile ? "none" : "block"};
  }
`
);

export const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: white;
  font-family: "aileron", sans-serif;
  font-size: 14px;
  border-radius: 4px;
  white-space: nowrap;
  margin-right: 20px;
  color: white;

  > img {
    margin-left: 8px;
    width: 20px;
    height: 20px;
  }
`;

export const LinkDropdownButton = styled(DropdownButton)`
  width: 98px;
  background: unset;
  border: unset;
  @media (min-width: 1281px) {
    display: none;
  }
  @media (max-width: 1280px) {
    display: flex;
  }
  @media (max-width: 700px) {
    display: none;
  }
`;

export const LanguageDropdownButton = styled(DropdownButton)`
  height: 36px;
  padding: 0 8px;
  background: var(--background-gradient);
  border: 1px solid var(--action-active);
  transition: background-color 0.3s ease;

  &:hover {
    background: var(--action-active);
  }

  > img {
    margin-right: 8px;
    margin-left: 0;
  }

  @media (max-width: 780px) {
    span {
      display: none;
    }
    > img {
      margin-right: 0;
    }
  }

  @media (max-width: 700px) {
    margin-right: 0;
  }
`;

export const LinkMenu = styled.ul(
  (props) => `
  position: absolute;
  top: 30px;
  left: 0;
  padding: 0;
  border-radius: 4px;
  border: 1px solid var(--action-active);
  background: var(--background-gradient);
  overflow: hidden;
  transition: opacity 0.3s ease;
  opacity: ${props.open ? 1 : 0};
  pointer-events: ${props.open ? "all" : "none"};

`
);

export const NavLinkMenu = styled(LinkMenu)`
  min-width: 180px;
  @media (min-width: 1281px) {
    display: none;
  }
  @media (max-width: 700px) {
    display: none;
  }
`;

export const LanguageMenu = styled(LinkMenu)`
  width: 160px;
  font-family: "Noto Sans", sans-serif;
  @media (max-width: 700px) {
    left: unset;
    right: 0;
  }
`;

export const ListItem = styled.li(
  (props) => `
  display: flex;
  align-items: center;
  width: 100%;
  border-bottom: 1px solid var(--action-active);
  padding: 0;
  transition: background-color 0.3s ease;
  background-color: transparent;
  white-space: nowrap;

  &:hover {
    background-color: var(--action-stroke);
  }

  a,
  button {
    display: flex;
    width: 100%;
    height: 100%;
    text-align: left;
    align-items: center;
    font-size: 14px;
    padding: 10px 16px;
    background: none;
    border: 0;
    color: white;
  }

  ${
    props.disabled &&
    `opacity: 0.5;
     pointer-events: none;
    `
  }

  a {
    &.active {
      background-color: var(--action-stroke);
    }
  }

  &:last-of-type {
    border-bottom: none;
  }

  @media (max-width: 1280px) {
    display: block;
  }

  @media (max-width: 780px) {
    span:not(.english) {
      display: none;
    }
  }
`
);
