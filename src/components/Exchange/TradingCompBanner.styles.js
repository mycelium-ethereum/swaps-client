import styled from "styled-components";
import liveIcon from "../../img/live.svg";
import closeRoundedIcon from "../../img/close-rounded.png";

export const TradingCompBanner = styled.div(
  (props) => `
  position: fixed;
  right: 0;
  top: 62px;
  height: 50px;
  background: linear-gradient(112.34deg, #003100 17.72%, rgba(0, 49, 0, 0) 120.46%), #000a00;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  transition: width 0.3s ease, opacity 0.3s ease;
  z-index: 20;
  opacity: 0;
  pointer-events: none;
  min-width: 320px;
  &.active {
    opacity: 1;
    pointer-events: all;
  }
  @media (max-width: 1000px) {
    height: 133px;
    padding: 8px 16px;
    align-items: flex-start;
    ${TextContainer} {
      flex-direction: column;
    }
    ${GenerateButton} {
      margin: 10px 0 0 0;
    }
    ${GreenText} {
      margin: 0;
    }
    ${BannerTitle} {
      margin:  8px 0;
    }
  }
  @media (max-width: 450px) {
    ${GenerateButton} {
      font-size: 12px;
    }
    ${CloseButton} {
      width: 14px;
      height: 14px;
    }
  }
  `
);

export const TextContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const FlexContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const LiveIcon = styled.img.attrs({ src: liveIcon })`
  width: 27px;
  height: 20px;
  margin-right: 8px;
`;

export const GreenText = styled.span`
  color: var(--action-active);
  font-weight: bold;
  display: inline-block;
  margin-right: 8px;
`;

export const BannerTitle = styled.span`
  font-weight: bold;
  display: inline-block;
  margin-right: 16px;
`;

export const GenerateButton = styled.button`
  background-color: transparent;
  border: 1px solid var(--action-active);
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  color: white;
  margin-left: 16px;
  transition: background-color 0.3s ease;
  &:hover {
    background-color: var(--action-active);
  }
`;

export const CloseButton = styled.img.attrs({ src: closeRoundedIcon })`
  cursor: pointer;
  width: 20px;
  height: 20px;
  transition: opacity 0.3s ease;
  &:hover {
    opacity: 0.5;
  }
`;
