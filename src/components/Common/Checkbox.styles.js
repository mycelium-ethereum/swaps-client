import styled from "styled-components";

export const CheckboxDot = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 10px;
  width: 10px;
  border-radius: 9999px;
  background-color: var(--cell-highlight);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
`;

export const CheckboxContainer = styled.div`
  position: relative;
  display: flex;
  height: 16px;
  width: 16px;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  border-radius: 4px;
  border: 1px solid var(--cell-highlight);
  > input {
    width: 100%;
    height: 100%;
    appearance: none;
  }
  > input:checked ~ ${CheckboxDot} {
    opacity: 1;
  }
`;
