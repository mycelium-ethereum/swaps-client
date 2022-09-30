import styled from "styled-components";

export const StyledBridgePage = styled.div`
  height: 100%;
  min-height: calc(100vh - 62px); // Remove nav height from page height calc
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const BridgeTable = styled.div`
  width: 538px;
  padding: 16px;
  background-color: var(--background-primary);
  border-radius: 8px;
  border: 1px solid var(--cell-stroke);

  .Exchange-swap-ball-container {
    transform: translateY(-8px);
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  width: 100%;
`;

export const SettingsIcon = styled.img`
  width: 20px;
  height: 20px;
`;

export const Label = styled.div`
  width: 100%;
  color: var(--text-secondary);
  margin-bottom: 6px;
`;

export const MaxButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--action-active);
  border-radius: 4px;
  margin-right: 16px;
  border: 0;
  width: 51px;
  height: 28px;
  font-weight: bold;
  color: white;
  &:before {
    content: "MAX";
  }
`;

export const FlexRow = styled.div`
  display: flex;
  align-items: center;
`;

export const FlexRowFull = styled(FlexRow)`
  width: 100%;
  justify-content: space-between;
`;

export const TokenBox = styled.div`
  padding: 16px;
  border-radius: 4px;
  border: 1px solid var(--action-active);
  width: 100%;
  margin-bottom: 16px;
`;

export const AmountInput = styled.input`
  padding: 0;
  font-size: 24px;
  font-weight: bold;
  &:not(:placeholder-shown) {
    color: white;
  }
  &:placeholder-shown {
    color: var(--text-secondary);
  }
`;

export const Divider = styled.hr`
  border-color: var(--action-active);
  margin: 16px 0;
`;
