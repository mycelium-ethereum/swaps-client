import { Link } from "react-router-dom";
import styled from "styled-components";

export const ArbiscanLink = styled.a.attrs({
  target: "_blank",
  rel: "noreferrer noopener",
})`
  display: block;
  text-decoration: none;
  margin-bottom: 4px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const BottomContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 9px 10px 16px;
  border-top: 1px solid var(--cell-stroke);
  transition: 0.3s;
`;

export const LeaderboardHeader = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  transition: 0.3s;
  z-index: 1;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  padding: 6px 8px;
  color: var(--background-primary);
  font-size: 8px;
  line-height: 12px;
  font-weight: 600;
  font-family: "Inter", sans-serif;
  background-color: var(--light-green);
  > span {
    display: flex;
    align-items: center;
  }
`;

export const LeaderboardContainer = styled.div`
  position: relative;
  margin: 16px;
  transition: 0.3s;
  border-radius: 4px;
  border: 1px solid var(--cell-stroke);
  overflow: hidden;
  font-size: 12px;

`;

export const LeaderboardBody = styled.div`
  padding: 4px 4px 8px;
  height: 170px;
  overflow: hidden;
  z-index: 2;
  position: relative;
`;


const getPositionOffeset = (userPosition) => {
  if (userPosition < 3) {
    return 0
  } else {
    return -(userPosition - 3) * (29 + 4) - 1
  }
}

export const SlidingLeaderboardBody = styled.div`
  transition: 1s;
  transition-timing-function: ease-out;
  transform: translateY(${(props) => getPositionOffeset(props.userPosition)}px)
`

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
    position: relative;
    display: flex;
    align-items: center;
    position: relative;
    width: 100%;
    transition: 1s;
    opacity: ${props.opacity};
    min-height: 29px;
    z-index: 2;
    ${Position} {
      background-color: transparent;
    }
    ${Position},
    ${UserAddress},
    ${Volume} {
      font-weight: ${props.isUser ? "bold" : "400"};
    }
    ${BorderOutline} {
      border-color: ${props.isUser ? "var(--action-active)" : 'transparent'};
    }
    `
);

export const Position = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 29px;
  width: 40px;
  min-width: 40px;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
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
  height: 29px;
`;

// positions are indexed from 1 in this context
const getOverlayOffset = (userPosition) => {
  if (userPosition < 3) {
    return `${(29 * userPosition) + (4 * (userPosition - 1))}px`
  } else {
    return `95px`;
  }
}

// Users position
export const UserRowOverlay = styled(UserRow)`
  position: absolute;
  top: ${(props) => getOverlayOffset(props.position)};
  left: 46px;
  padding-right: 8px;
  width: calc(100% - 40px);

  filter: drop-shadow(0px 0px 10px rgba(9, 130, 0, 0.6));
  background: linear-gradient(111.31deg, #003000 23.74%, rgba(0, 48, 0, 0) 99.29%);

  ${BorderOutline} {
    border-color: var(--action-active);
  }

  transition: 0.3s;
`

// green backround underlay which sits behind the table
export const UserPositionOverlay = styled(Position)`
  position: absolute;
  top: ${(props) => getOverlayOffset(props.position)};
  margin-left: 4px;
  padding-right: 4px;
  width: 42px;
  z-index: 1;
  background: var(--action-active);
  transition: 0.3s;
`


export const UserAddress = styled.span`
  display: inline-flex;
  align-items: center;
  padding-left: 16px;
  height: 100%;
`;

export const Volume = styled.span`
  display: inline-flex;
  align-items: center;
  padding-right: 5px;
  height: 100%;
  padding-right: 12px;
`;

export const UserDetails = styled.div`
  margin-left: 8px;
  span {
    display: block;
  }
  span:nth-child(2) {
    font-size: 12px;
    line-height: 18px;
    color: var(--text-secondary);
  }
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
`;

export const TradeNowButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  white-space: nowrap;
  height: 27px;
  background-color: var(--action-active);
  border-radius: 3px;
  border: none;
  transition: background-color 0.3s ease;
  color: white;
  text-decoration: none;
  margin-left: 16px;
  &:hover {
    background-color: var(--cell-stroke);
  }
`;

export const AmountText = styled.div``;
