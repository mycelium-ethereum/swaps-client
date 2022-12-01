import styled from "styled-components";
import { CompatibleToken, TokenIconSize, TokenIconSizeEnum } from "./types";
import { tokenAltText, tokenIcon } from "src/components/Stake/presets";

export const TokenIcon: React.FC<{ token: CompatibleToken; size: TokenIconSize }> = ({ token, size }) => (
  <Token src={tokenIcon[token]} alt={tokenAltText[token]} size={size} />
);

const Token = styled.img<{ size: TokenIconSize }>`
  margin-left: 8px;
  margin-right: 4px;
  width: ${({ size }) => (size === TokenIconSizeEnum.sm ? "16px" : "20px")};
`;
