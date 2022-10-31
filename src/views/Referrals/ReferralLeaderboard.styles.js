import styled from "styled-components";
import podiumBackground from "../../img/referrals-comp/podium-background.png";
import chevronDown from "../../img/chevron-down.svg";

export const CompetitionRewardsToggle = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 0;
  background-color: transparent;
  color: white;
  font-size: 16px;
  margin-bottom: 8px;
  width: 100%;
  padding: 0;
`;

export const ChevronDown = styled.img.attrs({
  src: chevronDown,
  alt: "chevron down",
})(
  (props) => `
  transition: transform 0.3s ease;
  transform: rotate(${props.isOpen ? "180deg" : "0"});
`
);

export const CompetitionRewardsBanner = styled.div(
  (props) => `
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid var(--action-active);
  overflow: hidden;
  opacity: ${props.isOpen ? "1" : "0"};
  max-height: ${props.isOpen ? "202px" : "0px"};
  transition: opacity 0.3s ease, max-height 0.3s ease, padding 0.3s ease;
  padding: ${props.isOpen ? "10px 0" : "0 0"};
  margin-bottom: ${props.isOpen ? "24px" : "0px"};
  @media only screen and (max-width: 875px) {
    max-height: ${props.isOpen ? "624px" : "0px"};
    padding: ${props.isOpen ? "8px" : "0 8px"};
  }
`
);

export const CompetitionRewardsContainer = styled.div(
  (props) => `
  position: relative;
  z-index: 1;
  &.desktop {
    display: flex;
    align-items: flex-end;
    column-gap: 8px;
    min-height: 180px;
    @media only screen and (max-width: 875px) {
      display: none;
    }
  }
  &.mobile {
    display: none;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    width: 100%;
    @media only screen and (max-width: 875px) {
      display: grid;
      row-gap: 8px;
    }
    ${PodiumItem} {
      width: 100%;
    }
  }
`
);

export const PodiumBackground = styled.img.attrs({ src: podiumBackground })`
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  object-fit: cover;
  object-position: left;
  min-height: 200px;
`;

export const PodiumItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 200px;
  border: 1px solid var(--action-active);
  border-radius: 7px;
  background: linear-gradient(83.12deg, rgba(9, 130, 0, 0.5) -208.54%, rgba(9, 130, 0, 0) 159.09%);
  padding: 10px;

  &.first {
    height: 178px;
  }
  &.second,
  &.third {
    height: 150px;
  }
  &.wildcard {
    padding-top: 20px;
    height: 105px;
  }

  > h3 {
    font-size: 14px;
    line-height: 21px;
    font-weight: 700;
    margin: 0;
  }
  > span {
    font-size: 12px;
    line-height: 18px;
  }
  > small {
    margin: 0;
    font-size: 8px;
  }
`;

export const RewardsTableContainer = styled.div(
  (props) => `
  overflow: hidden;
  border-radius: 4px;
  margin-top: 16px;
  margin-bottom: 34px;
  border: 1px solid var(--action-active);
  overflow: auto;
  &.referrals-table {
    max-height: 450px;
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
  &::-webkit-scrollbar-track {
    border-left: 1px solid var(--cell-stroke);
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
