import styled from "styled-components";

export const MobileNavMenu = styled.menu`
  padding: 0;
  margin: 0;
  overflow: hidden;

  .pools-link {
    display: block;
    text-decoration: none;
    padding: 0;
    width: calc(100% - 32px);
    margin: 30px auto 16px;
  }
`;

export const FlexContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 8px;
  padding: 0 16px;
  @media (max-width: 370px) {
    grid-template-columns: 1fr;
  }
`;

export const ScrollContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  @media (max-height: 957px) {
    overflow-y: auto;
    overflow-x: hidden;
  }
`;
export const Header = styled.div`
  padding: 11px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
`;

export const NavBackground = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
  object-fit: cover;
  object-position: left;
`;

export const HeaderClose = styled.div`
  font-weight: 400;
  font-size: 14px;
  line-height: 150%;
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--cell-highlight);
  color: var(--cell-highlight);
  transition: all 0.3s ease;

  .close-icon {
    margin-left: 0.5rem;
    font-size: 20px;
  }

  &:hover {
    background-color: var(--cell-highlight);
    color: white;
    > img {
      filter: invert(1) brightness(100);
    }
  }
`;

export const ButtonContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(100% - 32px);
  margin: 0 auto;
  height: 48px;
  border-radius: 4px;
  border: 1px solid var(--action-active);
  background: var(--background-navigation);
  transition: background 0.3s ease;
  font-size: 20px;
  line-height: 30px;

  svg {
    transition: color 0.3s ease;
  }

  &:hover {
    background: var(--action-active);
    svg {
      color: white;
    }
  }
`;

export const SwitchButton = styled.button`
  display: flex;
  justify-content: center;
  margin: 0 !important;
  font-size: 20px;
  line-height: 30px;
  height: 48px;
  width: 100%;
  background: var(--background-navigation);
  border: 0.5px solid var(--border-navigation);
  margin-left: 24px;
  transition: background 0.3s ease;
  white-space: nowrap;

  @media (max-width: 350px) {
    font-size: 14px;
    line-height: 24px;
    > img {
      width: 120px;
    }
  }

  &:hover {
    background: var(--action-active);
  }

  > img {
    height: 24px;
    width: 168px;
    margin-left: 8px;
  }
`;

export const AccountDropdownContainer = styled(ButtonContainer)`
  margin-bottom: 16px;
  width: 100%;
  button.App-cta.transparent {
    background: unset !important;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .address-btn-container {
    width: 100%;
  }
  .address-btn {
    width: 100%;
  }
  .user-address {
    display: block;
    font-size: 20px;
    line-height: 30px;
    margin-right: unset;
  }
  button svg {
    display: block;
    color: var(--action-active);
    margin-left: 8px;
  }
  .menu-items {
    background: var(--background-gradient);
  }
  .menu-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    width: 100%;
    transition: background-color 0.3s ease;
    background-color: transparent;
    > img {
      filter: invert(1) brightness(100);
    }
    > p {
      font-size: 14px;
    }
    &:hover {
      background-color: var(--action-stroke) !important;
    }
  }

  /* Wallet dropdown */
  .connect-wallet {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    span {
      font-size: 20px;
    }
  }

  @media (max-width: 350px) {
    .connect-wallet {
      span {
        font-size: 14px;
      }
    }
  }
`;

export const NetworkDropdownContainer = styled(ButtonContainer)`
  margin-bottom: 24px;
  width: 100%;
  .network-label {
    display: block !important;
    font-size: 20px;
    line-height: 30px;
  }
  .network-select {
    display: flex;
    justify-content: center;
    background: unset;
    width: 100%;
  }
  .Selector {
    width: 100%;
  }
  .Selector-box {
    width: 100%;
    border: 0;
    display: flex;
    justify-content: center;
    > img {
      margin-right: 8px;
    }
  }

  @media (max-width: 350px) {
    .network-label {
      font-size: 14px;
    }
  }
`;

export const AppHeaderLinkContainer = styled.div`
  &:first-child {
    border-top: 1px solid var(--cell-highlight);
  }
  border-bottom: 1px solid var(--cell-highlight);

  a {
    font-size: 20px;
    line-height: 18px;
    font-weight: normal;
    letter-spacing: 0.1px;
    color: #fff;
    padding: 21px 16px;
    text-decoration: none;
    display: block;
    transition: background-color 0.3s ease;
  }

  a:hover,
  a:focus,
  a:active {
    background-color: var(--action-active);
    color: white;
  }
`;

export const MyceliumCopy = styled.div`
  color: var(--action-active);
  font-size: 16px;
  padding: 21px 16px;
`;

const mobileButton = `
  text-align: center;
  padding: 1rem;
  font-size: 20px;
  background: var(--background-navigation)!important;
  border: 0.5px solid var(--border-navigation);
`;

export const PoolsSwitch = styled.div`
  font-size: 20px;
  padding-left: 16px;
  padding-right: 16px;
  a {
    ${mobileButton}
    display: flex;

    span:first-child {
      margin-right: 0.5rem;
    }
  }
`;
