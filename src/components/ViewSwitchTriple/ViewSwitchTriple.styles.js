import styled from "styled-components";

export const ViewSwitchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 16px 0 24px;
  width: 100%;
`;

export const ViewSwitch = styled.div`
  position: relative;
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--cell-stroke);
  max-width: 569px;
  width: 100%;
  height: 56px;
`;

export const ViewOption = styled.button`
  position: relative;
  z-index: 1;
  background: none;
  padding: 16px 18px;
  font-size: 16px;
  font-weight: 400;
  border: 0;
  width: 50%;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  white-space: nowrap;
  border-right: 1px solid var(--cell-stroke);
  &:last-of-type {
    border-right: 0;
  }
  &.selected {
    font-weight: bold;
    color: #fff;
    background-color: var(--action-active);
  }
`;
