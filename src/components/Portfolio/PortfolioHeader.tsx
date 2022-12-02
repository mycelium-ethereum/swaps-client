import Davatar from "@davatar/react";
import * as Styled from "src/views/Portfolio/Portfolio.styles";
import { truncateMiddleEthAddress } from "src/Helpers";
import { FC } from "react";
import { Token } from "src/types/tokens";
import { PortfolioPeriod, PortfolioPeriodEnum } from "src/types/portfolio";

const INITIAL_VIEWABLE_ASSETS = 3;
const PORTFOLIO_PERIODS = [PortfolioPeriodEnum.Day, PortfolioPeriodEnum.Week, PortfolioPeriodEnum.Month];

interface PortfolioHeaderProps {
  account: string;
  tokens: Token[];
  selectedAssets: Token[];
  selectedPeriod: PortfolioPeriod;
  showAllAssets: boolean;
  handleShowAllAssets: () => void;
  handleHideAllAssets: () => void;
  updateSelectedAssets: (asset: Token) => void;
  handlePeriodChange: (period: PortfolioPeriod) => void;
}

export const PortfolioHeader: FC<PortfolioHeaderProps> = ({
  account,
  tokens,
  selectedAssets,
  selectedPeriod,
  showAllAssets,
  handleShowAllAssets,
  handleHideAllAssets,
  updateSelectedAssets,
  handlePeriodChange,
}) => (
  <Styled.HeaderControls>
    <Styled.Label isGrey>User</Styled.Label>
    <Styled.UserContainer>
      <Styled.FlexRow>
        {account ? <Davatar size={32} address={account} /> : <Styled.EmptyAvatar />}
        {account && <Styled.UserAddress>{truncateMiddleEthAddress(account)}</Styled.UserAddress>}
      </Styled.FlexRow>
      <Styled.ClaimAccountButton>Claim Account</Styled.ClaimAccountButton>
    </Styled.UserContainer>
    <Styled.FlexRow margin>
      <Styled.Label marginTop marginRight>
        Selected Assets
      </Styled.Label>
      <Styled.PillRow>
        {tokens.slice(0, INITIAL_VIEWABLE_ASSETS).map((token: Token) => (
          <Styled.AssetButton onClick={() => updateSelectedAssets(token)} isActive={selectedAssets.includes(token)}>
            {token.imageUrl && <img src={token.imageUrl} alt={token.symbol} />}
            <span>{token.symbol}</span>
          </Styled.AssetButton>
        ))}
        {showAllAssets ? (
          <>
            {tokens.slice(INITIAL_VIEWABLE_ASSETS, tokens.length).map((token: Token) => (
              <Styled.AssetButton onClick={() => updateSelectedAssets(token)} isActive={selectedAssets.includes(token)}>
                {token.imageUrl && <img src={token.imageUrl} alt={token.symbol} />}
                <span>{token.symbol}</span>
              </Styled.AssetButton>
            ))}
            <Styled.PillButton onClick={handleHideAllAssets}>
              <span>Hide all</span>
            </Styled.PillButton>
          </>
        ) : (
          <Styled.PillButton onClick={handleShowAllAssets}>
            <span>View all</span>
          </Styled.PillButton>
        )}
      </Styled.PillRow>
    </Styled.FlexRow>
    <Styled.FlexRow>
      <Styled.Label marginTop marginRight>
        Time Period
      </Styled.Label>
      <Styled.PillRow noMarginBottom>
        {PORTFOLIO_PERIODS.map((period: PortfolioPeriod) => (
          <Styled.PillButton onClick={() => handlePeriodChange(period)} isActive={selectedPeriod === period}>
            {period}
          </Styled.PillButton>
        ))}
      </Styled.PillRow>
    </Styled.FlexRow>
  </Styled.HeaderControls>
);
