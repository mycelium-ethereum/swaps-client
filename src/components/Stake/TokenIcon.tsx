import styled from "styled-components";
import { CompatibleToken, TokenSize, TokenSizeEnum } from "./types";
import { tokenAltText, tokenIcon } from "src/components/Stake/presets";

export const TokenIcon: React.FC<{ token: CompatibleToken; size: TokenSize }> = ({ token, size }) => (
  <Token src={tokenIcon[token]} alt={tokenAltText[token]} size={size} />
);

const Token = styled.img<{ size: TokenSize }>`
  margin-left: 8px;
  margin-right: 4px;
  width: ${({ size }) => (size === TokenSizeEnum.sm ? "16px" : "20px")};
`;
