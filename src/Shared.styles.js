import styled from "styled-components";

export const RewardsButton = styled.button`
  display: flex;
  margin: 1.5rem auto 0 auto;
  justify-content: center;
  min-width: 200px;

  font-size: 16px;

  &:disabled,
  &[disabled]{
    background: var(--cell-unavailable);
    border: 1px solid var(--cell-unavailable-stroke);
    color: rgba(49, 87, 136, 0.2);
  }
`;
