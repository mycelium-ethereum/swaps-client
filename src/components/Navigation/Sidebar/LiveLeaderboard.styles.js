import styled from "styled-components";
import { NavLink } from "react-router-dom";

export const LeaderboardContainer = styled.div`
  width: 388px;
  padding: 12px 16px;
  border-radius: 4px;
  border: 1px solid var(--cell-stroke);
  background: rgba(0, 49, 0, 0.4);
  z-index: 998;
  transition: opacity 0.3s ease;
`;

export const LeaderboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;
  width: 100%;
  margin-bottom: 8px;
  .green {
    color: var(--action-active);
    display: inline-block;
    margin-right: 8px;
  }
  img {
    width: 27px;
    height: 20px;
    margin-right: 8px;
  }
`;

export const LeaderboardBody = styled.div`
  margin-bottom: 40px;
  padding-right: 24px;
`;

export const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

export const CloseButton = styled.button`
  background-color: transparent;
  border: none;
`;

export const CloseIcon = styled.img`
  width: 10px !important;
  height: 10px !important;
  margin-right: 0 !important;
`;

export const UserRow = styled.div(
  (props) => `
    display: flex;
    align-items: center;
    width: 100%;
    opacity: ${props.opacity};
    margin-bottom: 4px;
    min-height: 40px;
    filter: ${props.isUser ? "drop-shadow(0px 0px 10px rgba(9, 130, 0, 0.6))" : "none"};
    background: ${props.isUser ? "linear-gradient(111.31deg, #003000 23.74%, rgba(0, 48, 0, 0) 99.29%)" : "none"};
    ${Position} {
      background-color: ${props.isUser ? "var(--action-active)" : "transparent"};
    }
    ${Position},
    ${UserAddress},
    ${Volume} {
      font-weight: ${props.isUser ? "bold" : "400"};
    }
    ${BorderOutline} {
      border-color: ${props.isUser ? "var(--action-active)" : "transparent"};
    }
    `
);

export const Position = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  width: 80px;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
`;

export const UserAddress = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0 30px 0 16px;
  height: 100%;
`;

export const Volume = styled.span`
  display: inline-flex;
  align-items: center;
  padding-right: 5px;
  height: 100%;
`;

export const UserDetails = styled.div`
  margin-left: 8px;
  a {
    text-decoration: none;
  }
  span {
    display: block;
  }
  span:nth-child(2) {
    font-size: 12px;
    line-height: 18px;
    color: var(--text-secondary);
  }
`;

export const BorderOutline = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  border-width: 1px;
  border-left-width: 0;
  border-style: solid;
  height: 40px;
`;

export const ProgressBarContainer = styled.div`
  width: calc(100% + 32px);
  height: 16px;
  background-color: rgba(0, 48, 0, 0.2);
  transform: translateX(-16px);
  margin-bottom: 16px;
`;

export const ProgressBar = styled.div(
  (props) => `
    position: relative;
    height: 100%;
    width: ${props.percent}%;
    background: linear-gradient(90.35deg, rgba(79, 224, 33, 0.2) 5.23%, rgba(79, 224, 33, 0) 208.5%);
    &:after {
      content: "";
      position: absolute;
      width: 9%;
      right: 0;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
    }
  `
);

export const IndicatorLabel = styled.span`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: black;
  z-index: 1;
  font-size: 9px;
`;

export const IndicatorBar = styled.span`
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 5px;
  height: 100%;
`;

export const Indicator = styled.div`
  display: flex;
  justify-content: center;
  text-align: center;
  position: absolute;
  bottom: 0;
  width: 27px;
  height: 51px;
`;

export const UserIndicator = styled(Indicator)(
  (props) => `
    z-index: 2;
    bottom: 0;
    left: calc(${props.percent}% - 16px);
    color: var(--action-active);
    ${IndicatorBar} {
      background-color: var(--action-active);
    }
    ${IndicatorLabel} {
      top: 10px;
    }
  `
);

export const FivePercentIndicator = styled(Indicator)`
  right: 5%;
  color: white;

  ${IndicatorBar} {
    background-color: white;
  }
  ${IndicatorLabel} {
    top: 2px;
  }
`;

export const BoldPercentage = styled.span`
  font-weight: bold;
  font-size: 12px;
`;

export const BottomContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  justify-content: space-between;
`;

export const ViewLeaderboardButton = styled(NavLink)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  white-space: nowrap;
  height: 40px;
  background-color: var(--action-active);
  border-radius: 4px;
  border: none;
  transition: background-color 0.3s ease;
  color: white;
  text-decoration: none;
  margin-top: 16px;
  &:hover {
    background-color: var(--cell-stroke);
  }
`;

export const AmountText = styled.div`
  text-align: center;
`;
