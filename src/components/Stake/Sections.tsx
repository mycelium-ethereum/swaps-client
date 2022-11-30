import { BigNumber } from "ethers/lib/ethers";
import { FC } from "react";
import * as StakeV2Styled from "src/views/Stake/StakeV2Styles";
import { TokenIcon } from "src/components/Stake/TokenIcon";
import { CompatibleToken, TokenSize, TokenSizeEnum } from "src/components/Stake/types";
import { convertStringToFloat, convertBigNumberToString } from "src/utils/common";
import { ETH_DECIMALS, expandDecimals, formatAmount, USD_DECIMALS } from "src/Helpers";

interface WalletBalanceProps {
  large?: boolean;
  walletAmount: BigNumber;
  tokenUsdPrice: BigNumber;
  selectedToken: CompatibleToken;
  tokenSize: TokenSize;
  tokenDecimals?: number;
  decimals?: number;
}

export const WalletBalance: FC<WalletBalanceProps> = ({
  large,
  walletAmount,
  tokenUsdPrice,
  selectedToken,
  tokenSize = TokenSizeEnum.lg,
  decimals = 2,
}) => (
  <>
    <StakeV2Styled.FlexColEnd>
      <TokenAmountRow
        large={large}
        tokenAmount={convertBigNumberToString(walletAmount, decimals)}
        selectedToken={selectedToken}
        tokenSize={tokenSize}
        decimals={decimals}
      />
      <StakeV2Styled.Subtitle>
        ${formatAmount(tokenUsdPrice.mul(walletAmount).div(expandDecimals(1, USD_DECIMALS)), ETH_DECIMALS, 2, true)}
      </StakeV2Styled.Subtitle>
    </StakeV2Styled.FlexColEnd>
  </>
);

interface TokenAmountRowProps {
  large?: boolean;
  tokenAmount: string;
  selectedToken: CompatibleToken;
  tokenSize: TokenSize;
  decimals?: number;
}

export const TokenAmountRow: FC<TokenAmountRowProps> = ({
  large,
  tokenAmount,
  selectedToken,
  tokenSize,
  decimals = 2,
}) => (
  <>
    {/* @ts-ignore-next-line */}
    <StakeV2Styled.AmountRow large={large}>
      <span>{convertStringToFloat(tokenAmount.toString(), decimals)}</span>
      <TokenIcon token={selectedToken} size={tokenSize as TokenSize} />
      <span>{selectedToken}</span>
    </StakeV2Styled.AmountRow>
  </>
);
