import styled from "styled-components";

export const DropdownContainer = styled.div`
  position: relative;
`;

export const DropdownButton = styled.button`
  display: none;
  align-items: center;
  justify-content: flex-end;
  color: white;
  font-family: "aileron", sans-serif;
  font-size: 14px;
  width: 98px;
  background: unset;
  border: unset;
  margin-right: 20px;

  > img {
    margin-left: 8px;
    width: 20px;
    height: 20px;
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
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0;
  border-radius: 4px;
  width: 180px;
  height: 240px;
  border: 1px solid var(--action-active);
  background: var(--background-gradient);
  overflow: hidden;
  transition: opacity 0.3s ease;
  opacity: ${props.open ? 1 : 0};
  pointer-events: ${props.open ? "all" : "none"};

  @media (min-width: 1281px) {
    display: none;
  }
  @media (max-width: 670px) {
    display: none;
  }
`
);

export const ListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 100%;
  border-bottom: 1px solid var(--action-active);
  padding: 0;
  transition: background-color 0.3s ease;
  background-color: transparent;

  &:hover {
    background-color: var(--action-stroke);
  }

  a {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    font-size: 14px;
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
`;
