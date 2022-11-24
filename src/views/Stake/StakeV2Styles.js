import styled from "styled-components";

const lg = "1080px";
const sm = "550px";

export const StakeV2Content = styled.div`
  margin-left: auto;
  margin-right: auto;
  width: 100%;
`;

export const StakeV2Cards = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-gap: 1rem;

  & > .App-card-row .label {
    color: var(--text-secondary);
  }

  @media (max-width: ${lg}) {
    grid-template-columns: 1fr;
  }
`;

export const StakeV2Card = styled.div`
  margin-bottom: 32px;
  // chart and mlp info
  &.two-thirds {
    width: 100%;
    grid-column: span 2 / span 2;
    @media (max-width: ${lg}) {
      min-width: 100%;
    }
  }
`;

export const Card = styled.div`
  border: 1px solid var(--cell-stroke);
  border-radius: 4px;
`;

export const CardTitle = styled.div`
  padding: 0.75rem 1rem;
  font-size: 1rem;
  margin-bottom: 0;
  border-bottom: 1px solid var(--cell-stroke);

  gap: 8px;
  justify-content: start;

  img {
    width: 24px;
  }
`;

export const MlpInfo = styled.div`
  display: grid;
  grid-template-columns: 1.25fr 1fr;

  @media (max-width: ${sm}) {
    grid-template-columns: 1fr;
  }
`;

export const VestingInfo = styled.div`
  color: var(--text-primary);
  font-size: 16px;
`;

export const StakedTokens = styled.div`
  display: flex;
  border-bottom: 1px solid var(--cell-stroke);
  background: var(--cell-gradient);
  justify-content: space-between;
  padding: 1rem;
`;

export const RewardsBanner = styled.div`
  background: var(--cell-gradient);
  font-size: 16px;
  padding: 0 1rem;
  padding-bottom: 1rem;
  color: var(--text-primary);
  &:first-child {
    border-right: 1px solid var(--cell-stroke);
  }
`;

export const RewardsBannerRow = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--cell-stroke);
  border-top: ${({ borderTop }) => (borderTop ? "1px solid var(--cell-stroke)" : "none")};

  justify-content: space-between;
  padding: 1rem 0;

  &:nth-last-child(2) {
    border-bottom: none;
  }

  .App-card-row {
    margin-bottom: 0.5rem;
  }
  .App-card-row:last-child {
    margin-bottom: 0;
  }
`;

export const StakingBannerRow = styled(RewardsBannerRow)`
  padding: 1rem;

  &:last-child {
    border-bottom: none;
  }
`;

export const RewardsBannerTextWrap = styled.div`
  text-align: right;
`;

export const RewardsBannerText = styled.div`
  color: ${({ secondary }) => (secondary ? `var(--text-secondary)` : "var(--text-primary)")};
  font-size: ${({ large }) => (large ? `16px` : "12px")};
  font-weight: ${({ large }) => (large ? 600 : 400)};
  display: ${({ inline }) => (inline ? `inline` : "block")};
  margin-bottom: ${({ title }) => (title ? "0.5rem" : "0")};
`;

export const ModalRow = styled.div`
  border-bottom: 1px solid var(--cell-stroke);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  position: relative;

  font-size: 12px;

  .Toggle {
    position: absolute;
    right: 0;
    top: 0;
  }

  &:last-child {
    border-bottom: none;
  }
`;

export const ModalRowHeader = styled.div`
  color: var(--text-secondary);
  margin-bottom: 4px;
`;

export const ModalRowText = styled.div`
  color: ${({ secondary }) => (secondary ? `var(--text-secondary)` : "var(--text-primary)")};
  font-size: ${({ large }) => (large ? `16px` : "12px")};
  font-weight: ${({ large }) => (large ? 600 : 400)};
  display: ${({ inline }) => (inline ? `inline` : "block")};
`;

export const Buttons = styled.div`
  > button,
  > a.App-button-option {
    color: var(--action-active);
  }
`;

/* CLAIM MODAL */
export const ClaimModal = styled.div`
  .AppOrder-ball {
    pointer-events: none;
  }
`;

export const SpreadCapture = styled.div`
  & > .buy-input .Exchange-swap-section-top {
    font-size: 16px !important;
  }

  & > .buy-input {
    border: 1px solid var(--cell-highlight);
  }
`;

export const SpreadCaptureDescription = styled.div`
  color: var(--text-secondary);
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
`;

// Staking card styles
export const FlexRowColEnd = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

export const FlexRowEnd = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const FlexRowBetween = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const AmountRow = styled.div`
  display: flex;
  font-weight: bold;
  font-size: 14px;
  line-height: 21px;

  > img {
    margin-left: 8px;
    margin-right: 4px;
  }
`;

export const Subtitle = styled.span`
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
`;

export const Divider = styled.hr`
  border-color: var(--cell-stroke);
  margin-bottom: 12px;
  width: 100%;
`;

export const StakingButton = styled.button`
  border: 1px solid var(--action-active);
  background-color: transparent;
  height: 32px;
  width: 100px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--action-active);
  margin-left: 12px;
  font-size: 16px;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--action-hover);
    box-shadow: var(--action-shadow);
  }
`;
