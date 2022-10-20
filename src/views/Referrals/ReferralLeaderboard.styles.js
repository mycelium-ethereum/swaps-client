import styled from "styled-components";

export const RewardsTableContainer = styled.div`
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid var(--action-active);
  margin-top: 16px;
  margin-bottom: 34px;
`;

export const RewardsTable = styled.table`
  width: 100%;
  border-spacing: 0;
`;

export const RewardsTableHeading = styled.th`
  padding: 12px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: left;
  border-bottom: 1px solid var(--action-active);
  font-weight: 400;
`;

export const UserRow = styled.tr`
  position: relative;
  > td {
    position: relative;
    z-index: 1;
  }
  &.highlight {
    background-image: linear-gradient(111.31deg, #003000 23.74%, rgba(0, 48, 0, 0) 99.29%);
    border: 1px solid var(--action-active);
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
`;

export const NoData = styled.div`
  padding: 64px;
  text-align: center;
`;
