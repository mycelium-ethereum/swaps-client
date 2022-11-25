import { BigNumber } from "ethers/lib/ethers";
import { FC } from "react";
import * as StakeV2Styled from "src/views/Stake/StakeV2Styles";
import { TokenIcon } from "src/components/Stake/TokenIcon";
import { CompatibleToken, TokenSize, TokenSizeEnum } from "src/components/Stake/types";
import { convertStringToFloat, parseBigNumberToFloat } from "src/utils/common";
import { expandDecimals } from "src/Helpers";

interface WalletBalanceProps {
  large?: boolean;
  walletAmount: BigNumber;
  tokenUsdPrice: BigNumber;
  selectedToken: CompatibleToken;
  tokenSize: TokenSize;
}

export const USD_PRICE_PRECISION = 30;

export const WalletBalance: FC<WalletBalanceProps> = ({
  large,
  walletAmount,
  tokenUsdPrice,
  selectedToken,
  tokenSize = TokenSizeEnum.lg,
}) => (
  <>
    <StakeV2Styled.FlexRowColEnd>
      <TokenAmountRow
        large={large}
        tokenAmount={parseBigNumberToFloat(walletAmount, 2)}
        selectedToken={selectedToken}
        tokenSize={tokenSize}
      />
      <StakeV2Styled.Subtitle>
        ${parseBigNumberToFloat(tokenUsdPrice.mul(walletAmount).div(expandDecimals(1, USD_PRICE_PRECISION)), 2)}
      </StakeV2Styled.Subtitle>
    </StakeV2Styled.FlexRowColEnd>
  </>
);

interface TokenAmountRowProps {
  large?: boolean;
  tokenAmount: string;
  selectedToken: CompatibleToken;
  tokenSize: TokenSize;
}

export const TokenAmountRow: FC<TokenAmountRowProps> = ({ large, tokenAmount, selectedToken, tokenSize }) => (
  <>
    {/* @ts-ignore-next-line */}
    <StakeV2Styled.AmountRow large={large}>
      <span>{convertStringToFloat(tokenAmount.toString(), 2)}</span>
      <TokenIcon token={selectedToken} size={tokenSize as TokenSize} />
      <span>{selectedToken}</span>
    </StakeV2Styled.AmountRow>
  </>
);
