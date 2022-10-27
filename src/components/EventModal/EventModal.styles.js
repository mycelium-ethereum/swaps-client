import styled from "styled-components";
import Modal from "../Modal/Modal";
import referrals20k from "../../img/20k.svg";
import liveIcon from "../../img/live.svg";
import closeRoundedIcon from "../../img/close-rounded.png";

export const EventModalHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 157px;
  width: 100%;
  background-color: var(--background-primary);
  border-top-right-radius: 8px;
  border-top-left-radius: 8px;
  border-bottom: 0;
`;

// Temporary addition for Referrals Comp
export const ReferralsCompHeader = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 40px;
  width: calc(100% - 48px);
  background-color: var(--darkest-green);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--cell-stroke);
  z-index: 2;
  @media (max-width: 450px) {
    bottom: unset;
    top: 50%;
    transform: translate(-50%, -50%);
  }
`;
export const ReferralsCompAmount = styled.img.attrs({ src: referrals20k })`
  width: 100%;
  height: auto;
`;
export const LiveIcon = styled.img.attrs({ src: liveIcon })`
  width: 43px;
  height: 32px;
  margin-right: 8px;
`;

export const GreenText = styled.span`
  color: var(--action-active);
  font-weight: 600;
`;

export const LiveSpanContainer = styled.span`
  display: inline-flex;
  align-items: center;
  transform: translateY(7px);
`;
// End of temporary addition

export const ReferralsCompPrizeText = styled.span`
  display: block;
  font-weight: 600;
  font-size: 24px;
  line-height: 36px;
  text-align: center;
`;

export const EventModalGraphic = styled.img`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;

  ${({ infront }) =>
    infront
      ? `
      height: 296px;
      z-index: 1;
    `
      : ``}
`;

export const EventModalTitle = styled.div`
  margin-bottom: 1rem;
  small {
    display: block;
    font-size: 24px;
    line-height: 36px;
    font-weight: 600;
  }
  h2 {
    font-size: 24px;
    line-height: 24px;
    font-weight: 600;
    margin: 0 0 16px;
  }
  @media (max-width: 450px) {
    h2 {
      font-size: 20px;
      line-height: 20px;
    }
  }
`;

export const EventModalDivider = styled.hr`
  border-color: var(--cell-stroke);
  margin: 0 0 16px;
`;

export const EventModalContent = styled.div`
  position: relative;
`;

export const EventModalButtonContent = styled.div`
  display: grid;
  row-gap: 16px;

  span {
    font-weight: 300;
  }

  p {
    margin-top: 0px;
    margin-bottom: 8px;
  }

  a:not(.inline-link),
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    height: 44px;
    margin: 0;
    background-color: var(--action-active);

    img {
      margin-right: 10px;
    }

    &:hover {
      border-color: transparent;
      background-color: var(--cell-stroke) !important;
    }
  }
`;

export const EventModal = styled(Modal)(
  (props) => `
  .Modal-content {
    max-width: 465px;
    width: 100%;
    overflow: unset;
  }
  .Modal-body {
    padding-top: ${props.hideHeader ? "0" : "130px"};
    text-align: center;
    margin: 1rem 2rem;
  }
  .divider {
    display: none;
  }

  @media (max-width: 450px) {
    .Modal-content {
      max-width: calc(100% - 32px);
      overflow-x: hidden;
      overflow-y: auto;
    }
    ${EventModalTitle} {
      small {
        display: block;
        font-size: 20px;
        line-height: 30px;
        font-weight: 600;
      }
    }
    .Modal-body {
      margin: 0.5rem 1rem;
    }
    ${EventModalCloseButton} {
      top: -24px;
      right: -8px;
    }
    ${LiveIcon} {
      width: 24px;
    }
  }
`
);

export const EventModalCloseButton = styled.img.attrs({ src: closeRoundedIcon })`
  position: absolute;
  top: -16px;
  right: -24px;
  cursor: pointer;
  width: 20px;
  height: 20px;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.5;
  }
`;
