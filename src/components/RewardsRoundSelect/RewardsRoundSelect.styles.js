import styled from 'styled-components';

export const RewardsRoundSelect = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
`;
export const RewardsRoundSelectMenu = styled.div`
  position: relative;

  .menu-items {
    overflow-y: scroll;
    overflow-x: hidden;
    max-height: 168px;
  }
`;

export const RewardsRoundNextRewards = styled.span`
  margin-top: auto;
  padding-top: 0.5rem;
`;

export const RewardsRoundCountdown = styled.span`
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
    background-color: var(--cell-hover)!important;
    border: 1px solid var(--cell-highlight);
  }
`;

export const RewardsButton = styled.button`
  display: flex;
  margin: 1.5rem auto 0 auto;
  justify-content: center;
  min-width: 200px;

  font-size: 16px;

  &:disabled,
  &[disabled]{
    background: var(--cell-unavailable);
    border: 1px solid var(--cell-unavailable-stroke);
    color: rgba(49, 87, 136, 0.2);
  }
`;
