import styled from "styled-components";

export const ViewSwitchContainer = styled.div`
  display: flex;
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
  @media only screen and (max-width: 640px) {
    flex-direction: column;
    height: auto;
    max-width: 100%;
  }
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
  @media only screen and (max-width: 640px) {
    border-right: 0;
    border-top: 1px solid var(--cell-stroke);
    width: 100%;
    &:first-of-type {
      border-top: 0;
    }
  }
`;
