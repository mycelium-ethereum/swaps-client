import styled from "styled-components";

export const ToggleSwitch = styled.button`
  position: relative;
  width: 36px;
  height: 18px;
  background-color: var(--cell-stroke);
  border-radius: 30px;
`;

export const SwitchThumb = styled.span`
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background-color: var(--action-active);
  border-radius: 9999px;
`;
