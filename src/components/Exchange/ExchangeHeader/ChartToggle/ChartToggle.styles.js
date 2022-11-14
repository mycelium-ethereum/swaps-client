import styled from "styled-components";

export const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const ToggleSwitch = styled.button`
  position: relative;
  width: 38px;
  min-height: 20px;
  background-color: transparent;
  border-radius: 30px;
  margin-right: 8px;
  border: 1px solid;
  border-color: var(--text-secondary);
  transition: background-color 0.3s ease, border-color 0.3s ease;
  &.selected {
    background-color: var(--cell-stroke);
    border-color: var(--cell-stroke);
  }
`;

export const SwitchThumb = styled.span`
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  transition: transform 0.3s ease;
  background-color: var(--text-secondary);
  &.selected {
    background-color: var(--action-active);
    transform: translateX(18px);
  }
`;

export const SwitchText = styled.span`
  color: var(--text-secondary);
  transition: color 0.3s ease;
  &.selected {
    color: var(--action-active);
  }
`;
