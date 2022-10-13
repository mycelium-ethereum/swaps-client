import styled from 'styled-components';


export const TooltipRowValues = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    padding: 0.25rem 0 0 0;
    text-align: right;
  }
`
export const TooltipRowValue = styled.span`
  color: white;
  text-align: right;
`

export const TooltipRow = styled.div`
  display: grid;
  margin: 0 0 0.5rem 0;
  grid-template-columns: 1fr auto;

  & > span.label {
    margin-right: 0.5rem;
  }

  @media (max-width: 700px) {
    display: block;
    margin-bottom: 1rem;

    > span.label {
      display: block;
    }

    ${TooltipRowValues} li {
      text-align: left;
    }

    > ${TooltipRowValue} {
      text-align: left;
    }
  }

`

// .Tooltip-number {
  // color: white;
// }
