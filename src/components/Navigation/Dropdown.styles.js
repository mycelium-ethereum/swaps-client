import styled from "styled-components";

export const DropdownContainer = styled.div`
  position: relative;
`;

export const DropdownButton = styled.button(
  (props) => `
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: white;
  font-family: "aileron", sans-serif;
  font-size: 14px;
  border-radius: 4px;
  white-space: nowrap;
  ${
    props.isLanguageDropdown
      ? `
        height: 36px;
        padding: 0 8px;
        background: var(--background-gradient);
        border: 1px solid var(--action-active);
        transition: background-color 0.3s ease;
        &:hover {
          background: var(--action-active);
        }
        `
      : `
          width: 98px;
          background: unset;
          border: unset;
          `
  }

  margin-right: 20px;
  color: white;

  > img {
    ${props.isLanguageDropdown ? "margin-right: 8px" : "margin-left: 8px"};
    width: 20px;
    height: 20px;
  }
`
);

export const LinkDropdownButton = styled(DropdownButton)`
  @media (min-width: 1281px) {
    display: none;
  }
  @media (max-width: 1280px) {
    display: flex;
  }
  @media (max-width: 670px) {
    display: none;
  }
`;

export const LinkMenu = styled.ul(
  (props) => `
  position: absolute;
  top: 30px;
  left: 0;
  padding: 0;
  border-radius: 4px;
  width: 160px;
  border: 1px solid var(--action-active);
  background: var(--background-gradient);
  overflow: hidden;
  transition: opacity 0.3s ease;
  opacity: ${props.open ? 1 : 0};
  pointer-events: ${props.open ? "all" : "none"};

  ${
    !props.isLanguageDropdown
      ? `
      @media (min-width: 1281px) {
        display: none;
      }
      @media (max-width: 670px) {
        display: none;
      }
    `
      : `
      font-family: 'Noto Sans', sans-serif;
      `
  }
`
);

export const ListItem = styled.li(
  (props) => `
  display: flex;
  align-items: center;
  width: 100%;
  border-bottom: 1px solid var(--action-active);
  padding: 0;
  transition: background-color 0.3s ease;
  background-color: transparent;

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

  ${
    props.disabled &&
    `opacity: 0.5;
    pointer-events: none;
    `
  }
`
);
