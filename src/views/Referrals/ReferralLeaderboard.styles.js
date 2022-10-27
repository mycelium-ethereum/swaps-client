import styled from "styled-components";

export const RewardsTableContainer = styled.div(
  (props) => `
  overflow: hidden;
  border-radius: 4px;
  margin-top: 16px;
  margin-bottom: 34px;
  border: 1px solid var(--action-active);
  overflow: auto;
  &.referrals-table {
    height: 450px;
    border: 1px solid var(--cell-stroke);
    ${RewardsTableHeading} {
      border-bottom: 1px solid var(--cell-stroke);
    }
    tr {
      border-top: 1px solid var(--cell-stroke);
    }
    ${TableRow}.highlight {
      border: 1px solid var(--action-active) !important;
    }
  }
`
);

export const RewardsTable = styled.table`
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;

  thead {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 2;
    background-color: var(--background-primary);
    transform: translateY(-2px);
    border-bottom: 1px solid var(--cell-stroke);
  }
`;

export const RewardsTableHeading = styled.th`
  padding: 12px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: left;
  font-weight: 400;
  white-space: nowrap;
`;

export const TableRow = styled.tr`
  position: relative;
  > td {
    position: relative;
    z-index: 1;
  }
  &.highlight {
    background-image: linear-gradient(111.31deg, #003000 23.74%, rgba(0, 48, 0, 0) 99.29%);
    border-top: 1px solid var(--action-active) !important;
  }
  &.no-border {
    border: 0;
  }
`;

export const TableCell = styled.td`
  padding: 21px 16px;
  font-size: 14px;
  line-height: 21px;
  &.bold {
    font-weight: 700;
  }
  &.tier span:last-child {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
  }
`;

export const LeaderboardTitle = styled.div`
  display: flex;
  align-items: center;
  font-weight: bold;
  .green {
    display: inline-block;
    margin-right: 4px;
    color: var(--action-active);
  }
  > img {
    margin-right: 8px;
  }
`;

export const FlexBetweenContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media only screen and (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    ${LeaderboardTitle} {
      margin-bottom: 16px;
    }
    ${LeaderboardTitle} ~ div,
    .App-cta.transparent {
      width: 100%;
    }
  }
`;

export const NoData = styled.div`
  padding: 64px;
  text-align: center;
`;
