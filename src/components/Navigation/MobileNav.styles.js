import styled from 'styled-components';
import NetworkSelector from '../NetworkSelector/NetworkSelector';
import AddressDropdown from "../AddressDropdown/AddressDropdown";

export const AppHeaderLinkContainer = styled.div`
  border-top: 1px solid var(--cell-highlight);
  border-bottom: 1px solid var(--cell-highlight);

  a {
    font-size: 14px;
    line-height: 18px;
    font-weight: normal;
    letter-spacing: 0.1px;
    color: #fff;
    padding: 1.5rem 1rem;
    text-decoration: none;
    display: block;
  }

  a:hover,  a:focus, a:active {
    background: #303fd024;
    color: white;
  }
`

const mobileButton = `
  text-align: center;
  padding: 1rem;
  font-size: 20px;
  background: var(--background-navigation)!important;
  border: 0.5px solid var(--border-navigation);
`

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
`

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
    display: block!important;
    font-size: 20px;
  }
`

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
`
