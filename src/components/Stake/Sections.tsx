import { BigNumber } from "ethers/lib/ethers";
import { FC } from "react";
import * as StakeV2Styled from "src/views/Stake/StakeV2Styles";
import { TokenIcon } from "src/components/Stake/TokenIcon";
import { CompatibleToken, TokenIconSize, TokenIconSizeEnum } from "src/components/Stake/types";
import { convertStringToFloat } from "src/utils/common";
import { ETH_DECIMALS, expandDecimals, formatAmount, USD_DECIMALS } from "src/Helpers";
import { ZERO_BN } from "src/components/Stake/presets";

interface TokenAmountProps {
  large?: boolean;
  tokenAmount: BigNumber;
  tokenUsdPrice: BigNumber;
  selectedToken: CompatibleToken;
  tokenIconSize: TokenIconSize;
  decimals?: number;
}

export const TokenAmount: FC<TokenAmountProps> = ({
  large,
  tokenAmount,
  tokenUsdPrice,
  selectedToken,
  tokenIconSize = TokenIconSizeEnum.lg,
  decimals = 2,
}) => (
  <StakeV2Styled.FlexColEnd>
    <TokenAmountRow
      large={large}
      tokenAmount={formatAmount(tokenAmount || ZERO_BN, ETH_DECIMALS, decimals, false)}
      selectedToken={selectedToken}
      tokenIconSize={tokenIconSize}
      decimals={decimals}
    />
    <StakeV2Styled.Subtitle>
      $
      {formatAmount(
        tokenAmount && tokenUsdPrice ? tokenUsdPrice.mul(tokenAmount).div(expandDecimals(1, USD_DECIMALS)) : ZERO_BN,
        ETH_DECIMALS,
        2,
        true
      )}
    </StakeV2Styled.Subtitle>
  </StakeV2Styled.FlexColEnd>
);

interface TokenAmountRowProps {
  large?: boolean;
  tokenAmount: string;
  selectedToken: CompatibleToken;
  tokenIconSize: TokenIconSize;
  decimals?: number;
}

export const TokenAmountRow: FC<TokenAmountRowProps> = ({
  large,
  tokenAmount,
  selectedToken,
  tokenIconSize,
  decimals = 2,
}) => (
  <>
    {/* @ts-ignore-next-line */}
    <StakeV2Styled.AmountRow large={large}>
      <span>{convertStringToFloat(tokenAmount.toString(), decimals)}</span>
      <TokenIcon token={selectedToken} size={tokenIconSize as TokenIconSize} />
      <span>{selectedToken}</span>
    </StakeV2Styled.AmountRow>
  </>
);
