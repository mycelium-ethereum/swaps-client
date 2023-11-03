import styled from 'styled-components';

const lg = '1080px';
const sm = '550px';

export const StakeV2Content = styled.div`
  margin-left: auto;
  margin-right: auto;
  width: 100%;
`

export const StakeV2Cards = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  grid-gap: 1rem;

  & > .App-card-row .label {
    color: var(--text-secondary);
  }

  @media (max-width: ${lg}) {
    grid-template-columns: 1fr;
  }
`

export const StakeV2Card = styled.div`
  // chart and mlp info
  &:first-child {
    width: 100%;
    min-width: 775px;
    @media (max-width: ${lg}) {
      min-width: 100%;
    }
  }
`

export const Card = styled.div`
  border: 1px solid var(--cell-stroke);
  border-radius: 4px;
`

export const CardTitle = styled.div`
  padding: 0.75rem 0rem;
  font-size: 1rem;
  margin-bottom: 0;
  border-bottom: 1px solid var(--cell-stroke);

  gap: 8px;
  justify-content: start;

  img {
    width: 24px;
  }
`

export const MlpInfo = styled.div`
  display: grid;
  grid-template-columns: 1.25fr 1fr;

  @media (max-width: ${sm}) {
    grid-template-columns: 1fr;
  }
`

export const VestingInfo = styled.div`
  color: var(--text-primary);
  font-size: 16px;
  padding-top: 16px;
`

export const StakedTokens = styled.div`
  display: flex;
  border-bottom: 1px solid var(--cell-stroke);
  justify-content: space-between;
  padding: 1rem 0rem;
`

export const RewardsBanner = styled.div`
  font-size: 16px;
  padding: 0 1rem;
  padding-bottom: 1rem;
  color: var(--text-primary);
  &:first-child { 
    border-right: 1px solid var(--cell-stroke);
  }
`

export const RewardsBannerRow = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--cell-stroke);
  border-top: ${({ borderTop }) => borderTop ? '1px solid var(--cell-stroke)' : 'none'};

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
`

export const StakingBannerRow = styled(RewardsBannerRow)`
  padding: 1rem 0rem;

  &:last-child {
    border-bottom: none;
  }
`

export const RewardsBannerTextWrap = styled.div`
  text-align: right;
`

export const RewardsBannerText = styled.div`
  color: ${({ secondary }) => secondary ? `var(--text-secondary)` : 'var(--text-primary)'};
  font-size: ${({ large }) => large ? `16px` : '12px'};
  font-weight: ${({ large }) => large ? 600 : 400};
  display: ${({ inline }) => inline ? `inline` : 'block'};
  margin-bottom: ${({ title }) => title ? '0.5rem' : '0'};
`

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
`

export const ModalRowHeader = styled.div`
  color: var(--text-secondary);
  margin-bottom: 4px;
`

export const ModalRowText = styled.div`
  color: ${({ secondary }) => secondary ? `var(--text-secondary)` : 'var(--text-primary)'};
  font-size: ${({ large }) => large ? `16px` : '12px'};
  font-weight: ${({ large }) => large ? 600 : 400};
  display: ${({ inline }) => inline ? `inline` : 'block'};
`

export const Buttons = styled.div`
`

/* CLAIM MODAL */
export const ClaimModal = styled.div`
  .AppOrder-ball {
    pointer-events: none;
  }
`

export const SpreadCapture = styled.div`
  & > .buy-input .Exchange-swap-section-top {
    font-size: 16px!important;
  }

  & > .buy-input {
    border: 1px solid var(--cell-highlight);
  }
`

export const SpreadCaptureDescription = styled.div`
  color: var(--text-secondary);
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
`
