import styled from "styled-components";

export const StyledSettingsDropdown = styled.div`
  position: relative;

  .menu-items {
    overflow-y: scroll;
    overflow-x: hidden;
    max-height: 168px;
  }
`;

export const SettingSelectButton = styled.button`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;

  width: 342px;

  font-size: 16px;
  line-height: 150%;
  transition: background-color 0.3s ease, border 0.3s ease;
  border-radius: 4px;
  border: 1px solid var(--cell-stroke);

  &.App-cta {
    background: var(--background-secondary);
  }
  &.App-cta-selected,
  &.App-cta:hover {
    background-color: var(--cell-hover) !important;
    border: 1px solid var(--cell-highlight);
  }
`;
