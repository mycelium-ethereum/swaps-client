import styled from 'styled-components';



export const RewardsBanner = styled.div`
  width: calc(100% + 2rem);
  background: linear-gradient(180deg, #1C64F2 -208.23%, rgba(28, 99, 242, 0) 82.91%);
  font-size: 16px;
  padding: 1rem;
  margin: 1rem 0 1rem -1rem;
  color: var(--text-primary);
  border-top: 1px var(--border-primary) solid;
  border-bottom: 1px var(--border-primary) solid;
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
  display: ${({ inline }) => inline ? `inline` : 'block'};
`
