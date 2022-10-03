import styled from 'styled-components';

export const InnerBubble = styled.div`
  position: absolute;
  transition: 0.3s;
  background: var(--action-active);
  top: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;

`

export const StyledToggle = styled.div`
  display: flex;
  position: relative;

  transition: 0.3s;

  background: ${({ checked }) => checked ? 'var(--cell-stroke)' : 'var(--action-gradient)'};
  border-radius: 30.375px;
  width: 36px;
  height: 18px;

  ${InnerBubble} {
    left: ${({ checked }) => checked ? '20px' : '0'};
    background: ${({ checked }) => checked ? 'var(--action-active)': 'var(--action-inactive)'};
  }

  opacity: ${({ disabled }) => disabled ? '0.5' : '1'};

  cursor: pointer;
`
