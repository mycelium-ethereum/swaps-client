import styled from "styled-components";

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

export const AccountBannerRewards = styled.div`
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
    ${AccountBannerRewards} {
      width: 100%;
    }
  }
`;

export const PersonalRewardsContainer = styled.div`
  width: 100%;
`;

export const AppCardTitle = styled.div`
  font-weight: 600;
  font-size: 24px;
  line-height: 150%;
  margin-top: 10px;
`;

export const RewardsDataBoxes = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

export const RewardsDataBoxTitle = styled.div`
  line-height: 150%;
`;

export const RewardsDataBox = styled.div`
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
  border: 1px solid var(--cell-stroke);

  &.claimable {
    background: linear-gradient(180deg, rgba(20, 45, 29, 0.5) 0%, rgba(20, 45, 29, 0) 100%);
    border: 1px solid rgba(79, 196, 35, 0.3);

    ${RewardsDataBoxTitle} {
      color: #4fe021;
    }
  }
`;

export const LargeText = styled.span`
  font-size: 24px;
`;

export const ClaimedRewards = styled.div`
  display: flex;
  position: relative;
  width: 100%;
  margin-top: 1.5rem;
  text-align: center;
  font-size: 16px;
  color: var(--text-secondary);

  & * {
    width: 100%;
    margin: auto;
  }
  & span:first-child,
  & span:last-child {
    height: 1px;
    background: var(--cell-stroke);
  }
`;

export const RewardsData = styled.div`
  margin-top: 1rem;

  @media (max-width: 600px) {
    ${RewardsDataBox} {
      width: 100%;
    }
  }
`;

export const StyledRewardsPage = styled.div`
  align-items: center;
  padding-top: 1rem;
  ${RewardsData}, ${AccountBanner}, .Page-title-section {
    width: 100%;
  }

  .Page-title-section:first-child {
    padding-left: 0;
  }
`;

export const Title = styled.div`
  margin-bottom: 8px;
  font-size: 16px;
  line-height: 150%;
  color: white;
`;

export const LeaderboardTitle = styled(Title)`
  margin-top: 16px;
`;

export const LeaderboardContainer = styled.div`
  width: 100%;
`;

export const PersonalRewardsTableContainer = styled.div`
  position: relative;
  border: 1px solid var(--action-active);
  border-radius: 4px;
`;

export const RewardsTableContainer = styled.div`
  position: relative;
  margin-bottom: 74px;
`;

export const ScrollContainer = styled.div`
  position: relative;
  overflow: auto;
  width: 100%;
  max-height: 491px;
  &::-webkit-scrollbar-track {
    border-left: 1px solid var(--cell-stroke);
  }
`;

export const RewardsTable = styled.table`
  position: relative;
  z-index: 1;
  width: 100%;
  border-radius: 4px;
  border-collapse: collapse;
  border-spacing: 0;

  tbody tr {
    border-top: 1px solid var(--cell-stroke);
  }
  tbody tr:last-child {
    border-bottom: 0;
  }
  tbody tr.highlight-current {
    background: linear-gradient(111.31deg, #003000 23.74%, rgba(0, 48, 0, 0) 99.29%);
    border: 1px solid var(--action-active);
  }
`;

export const RewardsTableBorder = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  background-image: linear-gradient(111.31deg, var(--cell-stroke) 70%, rgba(0, 48, 0, 0) 99.29%);
  border-radius: 4px;
  z-index: 0;
  &:before {
    content: "";
    position: absolute;
    top: 1px;
    left: 1px;
    width: calc(100% - 2px);
    height: calc(100% - 2px);
    background-color: var(--background-primary);
    border-radius: 4px;
  }
`;

export const RewardsTableHeader = styled.thead`
  font-size: 12px;
  line-height: 150%;
  color: var(--text-secondary);
`;

export const RewardsTableHeading = styled.th`
  position: sticky;
  top: 0px;
  z-index: 1;
  padding: 16px;
  line-height: 150%;
  text-align: left;
  background-color: var(--background-primary);

  &:first-of-type {
    padding: 16px 32px;
    text-align: center;
    border-top-left-radius: 4px;
  }
  &:last-of-type {
    min-width: 60px; // Provide some spacing to right side of table when Claim button not present
    padding: 16px 32px 16px 0;
    border-top-right-radius: 4px;
  }
`;

const TableCell = styled.td`
  font-size: 16px;
  line-height: 150%;
  color: white;
  padding: 16px;
`;

export const TopFiveRow = styled.tr`
  &:after {
    display: none;
  }
  & + tr {
    &:after {
      display: none;
    }
  }
`;

export const TopFiveRowCell = styled(TableCell)`
  font-weight: bold;
  text-align: center;
  height: 40px;
  background: linear-gradient(180deg, #098200 0%, rgba(9, 130, 0, 0) 100%);
`;

export const RankCell = styled(TableCell)`
  text-align: center;
  font-weight: 700;
  padding: 0 16px 0 0;
`;

export const UserCell = styled(TableCell)`
  text-align: left;
  padding: 16px;
  font-size: 16px;
  > div:first-child {
    display: flex;
    align-items: center;
  }
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

export const VolumeCell = styled(TableCell)``;

export const RewardCell = styled(TableCell)``;

export const ClaimCell = styled(TableCell)`
  padding: 16px;
  font-size: 16px;
  span:nth-child(1) {
    font-size: 16px;
    color: white;
  }

  span.claimed {
    color: var(--text-secondary);
  }
`;

export const ClaimButton = styled.button`
  cursor: pointer;
  display: block;
  white-space: nowrap;
  padding: 0.4rem 0.7rem;
  border-radius: 3px;
  color: white;
  text-decoration: none;
  border: none;
  font-size: 1rem;
  background-color: var(--action-active);
  transition: background-color 0.3s ease;
  &:hover {
    background-color: var(--action-hover);
  }
`;

export const FullWidthText = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  width: 100%;
  font-size: 16px;
  color: white;
`;

export const EmptyAvatar = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background-color: white;
`;

export const GradientPlaceholder = styled.div`
  background-image: linear-gradient(111.31deg, var(--cell-stroke) 70%, rgba(0, 48, 0, 0) 99.29%);
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
    background: rgba(0, 9, 0, 0.9);
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
