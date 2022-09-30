import styled from "styled-components";
import Modal from "../../components/Modal/Modal";

export const StyledBridgePage = styled.div`
  height: 100%;
  min-height: calc(100vh - 62px); // Remove nav height from page height calc
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

export const BridgeTable = styled.div`
  max-width: 538px;
  width: 100%;
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

export const SettingsButton = styled.button`
  background-color: transparent;
  border: 0;
  > img {
    width: 20px;
    height: 20px;
  }
`;

export const SettingsModal = styled(Modal)`
  .Modal-content {
    height: 300px;
  }
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
  .TokenSelector-box {
    font-size: 24px;
    font-weight: 600;
    line-height: 36px;
  }
`;
export const TokenButton = styled.button`
  display: flex;
  align-items: center;
  background-color: transparent;
  border: 0;

  .token-icon {
    width: 30px;
    height: 30px;
    margin-right: 8px;
  }

  .token-name {
    font-weight: 600;
    font-size: 24px;
    line-height: 36px;
    margin-right: 12px;
    color: white;
  }

  .chevron-down {
    width: 19px;
    height: 19px;
  }
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

export const Subtitle = styled.span`
  font-size: 14px;
  white-space: nowrap;
  &.grey {
    color: var(--text-secondary);
    white-space: pre-wrap;
  }
  &.orange {
    color: var(--alert-active);
  }
`;

export const InfoRow = styled(FlexRowFull)`
  align-items: flex-start;
  margin-bottom: 8px;
`;

export const TotalText = styled.span`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;

  &.grey {
    color: var(--text-secondary);
  }
`;
