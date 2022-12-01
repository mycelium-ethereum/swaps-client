import styled from 'styled-components';
import chevronDownIcon from 'src/img/chevron-down.svg';

export const PortfolioContainer = styled.div`
  padding: 0 16px;
`;

export const HeaderControls = styled.div`
  margin-bottom: 40px;
`;

export const Label = styled.span<{ isGrey: boolean, marginTop?: boolean }>`
  display: inline-block;
  font-size: 12px;
  line-height: 18px;
  color: ${({ isGrey }) => (isGrey ? 'var(--text-secondary)' : 'white')};
  margin-top: ${({ marginTop }) => (marginTop ? '4px' : '0')};
`;

export const FlexRow = styled.div<{ margin?: boolean, alignCenter?: boolean }>`
  display: flex;
  align-items: ${({ alignCenter }) => (alignCenter ? 'center' : 'flex-start')};
  ${({ margin }) => (margin && 'margin-bottom: 16px')};
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

export const ClaimAccountButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  width: 99px;
  border: 1px solid var(--action-active);
  background-color: transparent;
  color: var(--action-active);
  font-size: 12px;
  margin-left: 32px;
  border-radius: 40px;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--action-active);
    color: white;
  }
`;

export const PortfolioButton = styled.button<{ marginLeft?: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 6px 8px;
  border: 1px solid var(--cell-stroke);
  color: white;
  border-radius: 40px;
  margin-left: ${({ marginLeft }) => marginLeft ? marginLeft : 0}px;
  transition: all 0.3s ease;
  background-color: rgba(0, 48, 0, 0.2);

  &:hover {
    background-color: var(--text-tertiary);
  }
`;

export const AssetButton = styled(PortfolioButton) <{ isActive: boolean }>`
  background-color: ${({ isActive }) => (isActive ? 'var(--text-tertiary)' : 'rgba(0, 48, 0, 0.2)')};
  margin-right: 8px;

  &:last-of-type {
    margin-right: 0;
  }

  > img {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }
`;

export const TokenRow = styled(FlexRow)`
  max-width: 500px;
  flex-wrap: wrap;
  margin-left: 8px;
  ${AssetButton}, ${PortfolioButton} {
    margin-bottom: 8px;
  }
`;

export const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  user-select: none;
`;

export const SectionLabel = styled.span`
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
export const TradeTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    border-bottom: 1px solid var(--cell-stroke);
  }
`;

export const TradeTableHeading = styled.th<{ rightAlign?: boolean }>`
  font-size: 8px;
  line-height: 12px;
  color: var(--text-secondary);
  text-align: ${({ rightAlign }) => (rightAlign ? 'right' : 'left')};
  padding: 6px 8px;
`;

