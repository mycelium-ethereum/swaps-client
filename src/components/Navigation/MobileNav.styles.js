import styled from "styled-components";
import NetworkSelector from "../NetworkSelector/NetworkSelector";

export const Header = styled.div`
  padding: 1.5rem 1rem;
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

export const SwitchButton = styled.button`
  width: 100%;
  margin: 0 !important;
  display: flex;
  justify-content: center;
  height: 48px;
  font-size: 20px;
  line-height: 30px;
  margin-bottom: 48px;
  > img {
    height: 24px;
    width: 168px;
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
    padding: 1.5rem 1rem;
    text-decoration: none;
    display: block;
  }

  a:hover,
  a:focus,
  a:active {
    background: #303fd024;
    color: white;
  }
`;

export const MyceliumCopy = styled.div`
  color: var(--action-active);
  font-size: 16px;
  padding: 1.5rem 1rem;
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
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  a {
    ${mobileButton}
    display: flex;

    span:first-child {
      margin-right: 0.5rem;
    }
  }
`;

export const MobileNetworkSelector = styled(NetworkSelector)`
  width: 100%;
  padding-left: 1.5rem;
  padding-right: 1.5rem;

  .network-select {
    background: transparent;
  }

  .react-select__control {
    ${mobileButton}
    width: 100%;
    margin: auto;
    height: auto;
    text-align: center;
  }

  .react-select__value-container {
    padding-left: 0;
  }

  .network-label {
    display: block !important;
    font-size: 20px;
  }
`;

export const AddressDropdownContainer = styled.div`
  .address-btn-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    button {
      ${mobileButton}
      width: 100%;
      border-radius: 4px;
    }
  }
`;
