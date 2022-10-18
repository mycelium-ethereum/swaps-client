import styled from "styled-components";

export const DropdownContainer = styled.div`
  position: relative;
`;

export const DropdownButton = styled.button`
  height: 36px;
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: linear-gradient(0deg, #098200, #098200), linear-gradient(0deg, rgba(0, 10, 0, 0.6), rgba(0, 10, 0, 0.6)),
    linear-gradient(83.12deg, rgba(9, 130, 0, 0.5) -208.54%, rgba(9, 130, 0, 0) 159.09%);

  > svg {
    margin-left: 8px;
  }
`;
