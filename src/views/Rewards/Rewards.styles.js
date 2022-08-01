import styled from "styled-components";

export const AccountBannerAddresses = styled.div`
  width: calc(60% - 1rem);

  > div {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const AccountBannerShortenedAddress = styled.div`
  font-weight: 400;
  font-size: 12px;
  color: var(--text-secondary);
`

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
`

export const AccountBanner = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 2rem;
  margin-top: 1rem;

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
`

export const AppCardTitle = styled.div`
  font-weight: 600;
  font-size: 24px;
  line-height: 150%;
  margin-top: 10px;
`

export const RewardsDataBoxes = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

export const RewardsDataBoxTitle = styled.div`
  line-height: 150%;
`

export const RewardsDataBox = styled.div`
  width: calc(50% - 0.5rem);
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 2rem;
  font-size: 16px;

  background: rgba(34, 39, 74, 0.2);

  &.claimable {
    background: linear-gradient(180deg, rgba(20, 45, 29, 0.5) 0%, rgba(20, 45, 29, 0) 100%);
    border: 1px solid rgba(79, 196, 35, 0.3);

    ${RewardsDataBoxTitle} {
      color: #4FE021;
    }
  }

`

export const LargeText = styled.span`
  font-size: 24px;
`

export const RewardsWeekSelect = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
`
export const RewardsWeekSelectMenu = styled.div`
  position: relative;

  .menu-items {
    overflow: scroll;
    max-height: 20rem;
  }
`

export const RewardsWeekNextRewards = styled.span`
  margin-top: auto;
  padding-top: 0.5rem;
`

export const RewardsWeekCountdown = styled.span`
  background: rgba(34, 39, 74, 0.2);
  border: 1px solid #2B2F51;
  padding: 4px 16px;

  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
`

export const WeekSelectButton = styled.button`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;

  width: 342px;

  font-size: 16px;
  line-height: 150%;

  border: 0.5px solid #7889A5;

  &.App-cta {
    background: rgba(34, 39, 74, 0.2);
  }
`

export const RewardsButton = styled.button`
  display: flex;
  margin: 1.5rem auto 0 auto;
  justify-content: center;
  min-width: 200px;

  font-size: 16px;
`

export const RewardsData = styled.div`
  margin-top: 1rem;

  @media (max-width: 600px) {
    ${RewardsDataBox} {
      width: 100%;
    }
  }
`

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
`

