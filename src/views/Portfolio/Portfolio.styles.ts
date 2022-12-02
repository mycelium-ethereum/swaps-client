import styled from 'styled-components';
import chevronDownIcon from 'src/img/chevron-down.svg';

const xl = "1500px";

export const PortfolioContainer = styled.div`
  padding: 0 16px;
  margin: 0 auto;
  max-width: 1460px;
`;

export const HeaderControls = styled.div`
  margin-bottom: 40px;
`;

export const Label = styled.span<{ isGrey: boolean, marginTop?: boolean, marginRight?: boolean }>`
  display: inline-block;
  font-size: 12px;
  line-height: 18px;
  color: ${({ isGrey }) => (isGrey ? 'var(--text-secondary)' : 'white')};
  margin-top: ${({ marginTop }) => (marginTop ? '4px' : '0')};
  margin-right: ${({ marginRight }) => (marginRight ? '8px' : '0')};
`;

export const FlexRow = styled.div<{ margin?: boolean, alignCenter?: boolean, wrap?: boolean }>`
  display: flex;
  align-items: ${({ alignCenter }) => (alignCenter ? 'center' : 'flex-start')};
  ${({ margin }) => (margin && 'margin-bottom: 16px')};
  flex-wrap: ${({ wrap }) => (wrap ? 'wrap' : 'nowrap')};
`;

export const FlexRowEnd = styled(FlexRow)`
  justify-content: flex-end;
`;

export const FlexCol = styled.div`
  display: flex;
  flex-direction: column;
`;

export const FlexColEnd = styled(FlexCol)`
  align-items: flex-end;
`;

export const UserContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  margin-top: 8px;
`;

export const UserAddress = styled.span`
  display: inline-block;
  font-size: 24px;
  line-height: 36px;
  font-weight: 600;
  margin-left: 8px;
`;

export const EmptyAvatar = styled.div`
  width: 32px;
  height: 32px;
`;

export const PortfolioGreenButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 6px 8px;
  border: 1px solid var(--action-active);
  background-color: transparent;
  color: var(--action-active);
  font-size: 12px;
  white-space: nowrap;
  border-radius: 40px;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--action-active);
    color: white;
  }
`;

export const ClaimAccountButton = styled(PortfolioGreenButton)`
  margin-left: 32px;
`;

export const FullScreenButton = styled(PortfolioGreenButton)`
  margin-left: 16px;
`;

export const PillButton = styled.button<{ isActive: boolean, marginLeft?: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 4px 8px;
  border: 1px solid var(--cell-stroke);
  color: white;
  border-radius: 40px;
  margin-left: ${({ marginLeft }) => marginLeft ? marginLeft : 0}px;
  transition: all 0.3s ease;
  background-color: ${({ isActive }) => (isActive ? 'var(--text-tertiary)' : 'rgba(0, 48, 0, 0.2)')};

  &:hover {
    background-color: var(--text-tertiary);
  }
`;

export const AssetButton = styled(PillButton)`
  > img {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }
`;

export const PillRow = styled(FlexRow) <{ noMarginBottom?: boolean }>`
  max-width: 500px;
  flex-wrap: wrap;
  ${AssetButton}, ${PillButton} {
    margin-right: 8px;
    margin-bottom: ${({ noMarginBottom }) => (noMarginBottom ? '0' : '8px')};
    &:last-of-type {
      margin-right: 0;
    }
  }
`;

export const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  user-select: none;
  cursor: pointer;
`;

export const SectionLabel = styled.span`
  display: inline-block;
  margin-right: 8px;
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
`;

export const ChevronDown = styled.img.attrs({ src: chevronDownIcon }) <{ isActive: boolean }>`
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
  transform: ${({ isActive }) => (isActive ? 'rotate(180deg)' : 'rotate(0)')};
`;

export const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 18px;
  margin-bottom: 40px;

  @media only screen and (max-width: ${xl}) {
    display: flex;
    flex-direction: column-reverse;
  }
`;

export const SectionContainer = styled.div`
  margin-bottom: 28px;
`;

export const LeftSide = styled.div`
  grid-column: 1 / span 5;
`;

export const RightSide = styled.div`
  grid-column: 6 / span 7;
`;

export const PortfolioTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  max-height: 500px;
  overflow: auto;

  thead {
    border-bottom: 1px solid var(--cell-stroke);
  }
`;

export const PortfolioTableHeading = styled.th<{ rightAlign?: boolean }>`
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
  text-align: ${({ rightAlign }) => (rightAlign ? 'right' : 'left')};
  padding: 6px 8px;
  vertical-align: top;
  font-weight: 400;
`;

export const IndicatorBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background-color: var(--dark-green);
  font-size: 10px;
  font-weight: 600;
`;

export const TableCell = styled.td<{ rightAlign?: boolean }>`
  font-size: 14px;
  line-height: 21px;
  color: white;
  text-align: ${({ rightAlign }) => (rightAlign ? 'right' : 'left')};
  padding: 6px 16px 6px 8px;
  &:last-of-type {
    padding: 6px 8px;
  }
`;

export const TableRow = styled.tr`
  border-bottom: 1px solid var(--cell-stroke);
  &:last-of-type {
    border-bottom: none;
  }
`;

export const SideLabel = styled.span<{ isShort: boolean }>`
  display: inline-block;
  color: ${({ isShort }) => (isShort ? 'var(--short-active)' : 'var(--long-active)')};
`;

export const SmallLabel = styled.span`
  display: inline-block;
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
  white-space: nowrap;
`;

export const DateTimeLabel = styled(SmallLabel)`
  display: inline-block;
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
  margin-bottom: 4px;

  &:last-of-type {
    margin-left: 4px;
  }
`;

export const AssetIcon = styled.img`
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 9999px;
`;

export const PnlCell = styled(TableCell) <{ isUp: boolean }>`
  color: ${({ isUp }) => (isUp ? 'var(--long-active)' : 'var(--short-active)')};

  img {
    width: 14px;
    height: 14px;
    margin-right: 3px;
  }
  span:first-of-type {
    display: inline-block;
    margin-right: 4px;
  }
  .position-up-arrow {
    display: ${({ isUp }) => (isUp ? 'inline' : 'none')};
  }
  .position-down-arrow {
    display: ${({ isUp }) => (isUp ? 'none' : 'inline')};
  }
`;

export const WinRateLabel = styled.span<{ aboveSixtyPercent: boolean }>`
  display: inline-block;
  color: ${({ aboveSixtyPercent }) => (aboveSixtyPercent ? 'var(--long-active)' : 'var(--short-active)')};
`;
