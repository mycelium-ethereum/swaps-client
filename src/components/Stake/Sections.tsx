import { BigNumber } from "ethers/lib/ethers";
import { FC } from "react";
import * as StakeV2Styled from "src/views/Stake/StakeV2Styles";
import { TokenIcon } from "src/components/Stake/TokenIcon";
import { CompatibleToken, TokenSize, TokenSizeEnum } from "src/components/Stake/types";
import { convertStringToFloat } from "src/utils/common";

interface WalletBalanceProps {
  walletAmount: BigNumber;
  mycUsdPrice: BigNumber;
  selectedToken: CompatibleToken;
}

export const WalletBalance: FC<WalletBalanceProps> = ({ walletAmount, mycUsdPrice, selectedToken }) => (
  <>
    <StakeV2Styled.FlexRowColEnd>
      <TokenAmountRow
        tokenAmount={convertStringToFloat(walletAmount.toString(), 2)}
        selectedToken={selectedToken}
        tokenSize={TokenSizeEnum.lg}
      />
      <StakeV2Styled.Subtitle>
        ${convertStringToFloat(mycUsdPrice.mul(walletAmount).toString(), 2)}
      </StakeV2Styled.Subtitle>
    </StakeV2Styled.FlexRowColEnd>
  </>
);

interface TokenAmountRowProps {
  tokenAmount: string;
  selectedToken: CompatibleToken;
  tokenSize: TokenSize;
}

export const TokenAmountRow: FC<TokenAmountRowProps> = ({ tokenAmount, selectedToken, tokenSize }) => (
  <StakeV2Styled.AmountRow>
    <span>{convertStringToFloat(tokenAmount.toString(), 2)}</span>
    <TokenIcon token={selectedToken} size={tokenSize as TokenSize} />
    <span>{selectedToken}</span>
  </StakeV2Styled.AmountRow>
);
