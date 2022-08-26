import styled from 'styled-components';

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
  width: 392px;
  height: 56px;
`;

export const ViewOption = styled.button`
  position: relative;
  z-index: 1;
  text-align: left;
  background: none;
  padding: 16px 18px;
  font-size: 16px;
  font-weight: 400;
  border: 0;
  width: 50%;
  color: var(--text-secondary);
  transition: color 0.3s ease, font-weight 0.3s ease;
  &.selected {
    font-weight: bold;
    color: #fff;
  }
`;

export const SwitchBackdrop = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  transition: left 0.3s ease;
  background-color: var(--action-active);
  &.right-selected {
    left: 50%;
  }
`;

