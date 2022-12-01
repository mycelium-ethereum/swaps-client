import Davatar from "@davatar/react";
import * as Styled from "src/views/Portfolio/Portfolio.styles";
import { truncateMiddleEthAddress } from "src/Helpers";
import { FC } from "react";
import { Token } from "src/types/tokens";

const INITIAL_VIEWABLE_ASSETS = 3;

interface PortfolioHeaderProps {
  address: string;
  tokens: Token[];
  selectedAssets: Token[];
  showAllAssets: boolean;
  handleShowAllAssets: () => void;
  handleHideAllAssets: () => void;
  updateSelectedAssets: (asset: Token) => void;
}

export const PortfolioHeader: FC<PortfolioHeaderProps> = ({
  address,
  tokens,
  selectedAssets,
  showAllAssets,
  handleShowAllAssets,
  handleHideAllAssets,
  updateSelectedAssets,
}) => (
  <Styled.HeaderControls>
    <Styled.Label isGrey>User</Styled.Label>
    <Styled.UserContainer>
      <Styled.FlexRow>
        {address ? <Davatar size={32} address={address} /> : <Styled.EmptyAvatar />}
        {address && <Styled.UserAddress>{truncateMiddleEthAddress(address)}</Styled.UserAddress>}
      </Styled.FlexRow>
      <Styled.ClaimAccountButton>Claim Account</Styled.ClaimAccountButton>
    </Styled.UserContainer>
    <Styled.FlexRow margin>
      <Styled.Label marginTop>Selected Assets</Styled.Label>
      <Styled.TokenRow>
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
            <Styled.PortfolioButton onClick={handleHideAllAssets}>
              <span>Hide all</span>
            </Styled.PortfolioButton>
          </>
        ) : (
          <Styled.PortfolioButton onClick={handleShowAllAssets}>
            <span>View all</span>
          </Styled.PortfolioButton>
        )}
      </Styled.TokenRow>
    </Styled.FlexRow>
    <Styled.FlexRow alignCenter>
      <Styled.Label>Time Period</Styled.Label>
      <Styled.PortfolioButton>
        <span>1D</span>
      </Styled.PortfolioButton>
    </Styled.FlexRow>
  </Styled.HeaderControls>
);
