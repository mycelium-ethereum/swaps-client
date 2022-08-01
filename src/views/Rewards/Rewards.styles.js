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
  padding: 2rem;
  font-size: 16px;

  background: var(--background-secondary);

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

export const RewardsWeekSelect = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
`;
export const RewardsWeekSelectMenu = styled.div`
  position: relative;
`;

export const RewardsWeekNextRewards = styled.span`
  margin-top: auto;
  padding-top: 0.5rem;
`;

export const RewardsWeekCountdown = styled.span`
  background: var(--background-secondary);
  border: 1px solid #2b2f51;
  padding: 4px 16px;

  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
`;

export const WeekSelectButton = styled.button`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;

  width: 342px;

  font-size: 16px;
  line-height: 150%;

  border: 0.5px solid var(--cell-stroke);

  &.App-cta {
    background: var(--background-secondary);
  }
`;

export const RewardsButton = styled.button`
  display: flex;
  margin: 1.5rem auto 0 auto;
  justify-content: center;
  min-width: 200px;

  font-size: 16px;
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
  padding-top: 3rem;
  ${RewardsData}, ${AccountBanner}, .Page-title-section {
    max-width: 900px;
    width: 100%;
  }

  .Page-title-section:first-child {
    padding-left: 0;
  }
`;

export const ViewSwitchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 16px 0 24px;
  max-width: 900px;
  width: 100%;
`;

export const ViewSwitch = styled.div`
  position: relative;
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--cell-stroke);
  width: 392px;
  height: 56px;
`;

export const ViewOption = styled.button`
  position: relative;
  z-index: 1;
  text-align: left;
  background: none;
  padding: 16px 18px;
  font-size: 16px;
  font-weight: 400;
  border: 0;
  width: 50%;
  color: var(--text-secondary);
  transition: color 0.3s ease, font-weight 0.3s ease;
  &.selected {
    font-weight: bold;
    color: #fff;
  }
`;

export const SwitchBackdrop = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  transition: left 0.3s ease;
  background-color: var(--action-active);
  &.leaderboard-selected {
    left: 50%;
  }
`;

export const Title = styled.div`
  margin-bottom: 8px;
  font-size: 16px;
  line-height: 150%;
  color: #ffffff;
`;

export const LeaderboardContainer = styled.div`
  max-width: 900px;
  width: 100%;
`;

export const RewardsTableContainer = styled.div`
  position: relative;
`;

export const RewardsTable = styled.table`
  position: relative;
  z-index: 1;
  width: 100%;
  border-radius: 4px;
  border: 0;
  border-collapse: separate;
  border-spacing: 0 1px;
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
  padding: 16px 32px;
  border-bottom: 1px solid var(--cell-stroke);
`;

export const RankCell = styled.td`
  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
  padding: 25px 32px;
  color: #ffffff;
`;
