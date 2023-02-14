import styled from "styled-components";
import Modal from "../../components/Modal/Modal";

export const AccountBannerAddresses = styled.div`
  width: calc(60% - 1rem);

  > div {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const AccountBannerShortenedAddress = styled.div`
  font-weight: 400;
  font-size: 12px;
  color: var(--text-secondary);
`;

export const AccountBannerReferral = styled.div`
  width: 40%;
  margin-top: auto;

  > .App-card-row {
    margin: 0.5rem 0;
  }

  > .App-card-row:last-child {
    margin-top: 0.5rem;
    margin-bottom: 0;
  }
`;

export const AccountBanner = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 2rem;

  > .App-button-option {
    width: 50%;
  }

  @media (max-width: 910px) {
    flex-wrap: wrap;
    ${AccountBannerAddresses} {
      width: 100%;
    }
    ${AccountBannerReferral} {
      width: 100%;
    }
  }
`;

export const PersonalReferralContainer = styled.div`
  width: 100%;
`;

export const AppCardTitle = styled.div`
  font-weight: 600;
  font-size: 24px;
  line-height: 150%;
  margin-top: 10px;
`;

export const InputCodeText = styled.div`
  margin: 0 auto;
  max-width: 460px;
  text-align: center;
`;

export const ReferralDataBoxes = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

export const ReferralDataBoxTitle = styled.div`
  line-height: 150%;
`;

export const ReferralDataBox = styled.div`
  width: calc(50% - 0.5rem);
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  padding: 2rem;
  font-size: 16px;

  background: var(--background-secondary);

  &.claimable {
    background: linear-gradient(180deg, rgba(20, 45, 29, 0.5) 0%, rgba(20, 45, 29, 0) 100%);
    border: 1px solid rgba(79, 196, 35, 0.3);

    ${ReferralDataBoxTitle} {
      color: #4fe021;
    }
  }
`;

export const LargeText = styled.span`
  font-size: 24px;
`;

export const ReferralRoundSelect = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
`;
export const ReferralRoundSelectMenu = styled.div`
  position: relative;

  .menu-items {
    overflow-y: scroll;
    overflow-x: hidden;
    max-height: 168px;
  }
`;

export const ReferralRoundNextReferral = styled.span`
  margin-top: auto;
  padding-top: 0.5rem;
`;

export const ReferralRoundCountdown = styled.span`
  background: var(--background-secondary);
  border: 1px solid #2b2f51;
  padding: 4px 16px;

  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
`;

export const RoundSelectButton = styled.button`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;

  width: 342px;

  font-size: 16px;
  line-height: 150%;
  transition: background-color 0.3s ease, border 0.3s ease;
  border-radius: 4px;
  border: 1px solid var(--cell-stroke);

  &.App-cta {
    background: var(--background-secondary);
  }
  &.App-cta-selected,
  &.App-cta:hover {
    background-color: #161a2d !important;
    border: 1px solid var(--cell-highlight);
  }
`;

export const ReferralButton = styled.button`
  display: flex;
  margin: 1.5rem auto 0 auto;
  justify-content: center;
  min-width: 200px;

  font-size: 16px;
`;

export const ReferralData = styled.div`
  margin-top: 1rem;

  @media (max-width: 600px) {
    ${ReferralDataBox} {
      width: 100%;
    }
  }
`;

export const StyledReferralPage = styled.div`
  align-items: center;
  padding-top: 1rem;
  max-width: 1000px;
  ${ReferralData}, ${AccountBanner}, .Page-title-section {
    width: 100%;
  }

  .Page-title-section:first-child {
    padding-left: 0;
  }
  @media (max-width: 700px) {
    padding-top: 0;
  }
`;

export const EmptyAvatar = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background-color: white;
`;

export const Title = styled.div`
  margin-bottom: 8px;
  font-size: 16px;
  line-height: 150%;
  color: white;
`;

export const PersonalReferralTableContainer = styled.div`
  position: relative;
`;

export const ScrollContainer = styled.div`
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  max-height: 491px;
`;

export const ConnectWalletOverlay = styled.div`
  position: relative;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 9, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    border-radius: 4px;
  }
`;

export const ConnectWalletText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;

  span {
    display: block;
    font-size: 14px;
    color: white;
    margin-bottom: 8px;
  }
`;

export const WalletIcon = styled.img`
  width: 22px;
  height: 19px;
  margin-left: 10px;
`;

export const FlexContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const TableContainer = styled.div`
  @media (max-width: 1000px) {
    overflow-y: hidden;
    overflow-x: scroll;
  }
`;

export const CodesTable = styled.table`
  margin: 0 auto;
  width: 100%;
  td:first-child,
  th:first-child {
    padding-left: 0;
  }
  min-width: 750px;
`;

export const TableHeading = styled.th(
  (props) => `
  font-weight: 400;
  color: var(--text-secondary);
  text-align: ${props.leftAlign ? "left" : "right"};
  padding: 0 32px 8px;
  `
);

export const TableCell = styled.td(
  (props) => `
  font-weight: 700;
  text-align: ${props.leftAlign ? "left" : "right"};
  padding: 0 32px 8px;
  > div {
    display: flex;
    align-items: center;
    whitespace: no-wrap;
  }
  `
);

export const CreateButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 125px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid var(--cell-stroke);
  font-size: 14px;
  font-weight: 700;
  color: white;
  background-color: transparent;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--cell-highlight);
  }
`;

export const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const CodeModal = styled(Modal)`
  padding: 0 16px;
  .Modal-content {
    border: 1px solid var(--cell-highlight);
    border-radius: 8px;
    max-width: 435px;
    width: 100%;
  }
  .Modal-content .divider {
    display: none;
  }
`;

export const ErrorText = styled.span`
  display: block;
  color: var(--danger-active);
  overflow: hidden;
  height: 0px;
  opacity: 0;
  transition: height 0.3s ease, opacity 0.3s ease;
`;

export const CodeInput = styled.input`
  width: 100%;
  height: 56px;
  border-radius: 4px;
  border: 1px solid var(--cell-stroke);
  font-size: 16px;
  line-height: 150%;
  padding: 16px;
  margin-bottom: 16px;

  &::placeholder {
    color: var(--text-secondary);
  }

  &:invalid + ${ErrorText} {
    height: 36px;
    opacity: 1;
  }

  &:invalid + ${ErrorText} + button {
    background: var(--danger);
    color: var(--danger-active) !important;
    pointer-events: none;
  }
`;

export const CodeButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 44px;
`;

export const CopyButton = styled.button`
  background-color: transparent;
  border: 0;
  width: 14px;
  height: 14px;
  > img {
    width: 14px;
    height: 14px;
  }
`;

export const ReferralsClaimModalRow = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: auto auto;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
  color: var(--text-secondary);

  div:last-child {
    color: var(--text-primary);
    text-align: right;
  }
`;
