import styled from 'styled-components';



export const RewardsBanner = styled.div`
  width: calc(100% + 2rem);
  background: var(--cell-gradient);
  font-size: 16px;
  padding: 1rem;
  margin: 1rem 0 1rem -1rem;
  color: var(--text-primary);
  border-top: 1px var(--cell-stroke) solid;
  border-bottom: 1px var(--cell-stroke) solid;
`

export const RewardsBannerRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 16px 0;
`

export const RewardsBannerTextWrap = styled.div`
  text-align: right;
`

export const RewardsBannerText = styled.div`
  color: ${({ secondary }) => secondary ? `var(--text-secondary)` : 'var(--text-primary)'};
  font-size: ${({ large }) => large ? `24px` : '16px'};
  font-weight: ${({ large }) => large ? 600 : 400};
  display: ${({ inline }) => inline ? `inline` : 'block'};
`
