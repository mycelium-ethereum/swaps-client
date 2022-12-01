import { Redirect, useParams } from "react-router-dom";
import * as Styled from "./Portfolio.styles";
import { useChainId } from "src/Helpers";
import { getTokens } from "src/data/Tokens";
import { useState } from "react";
import { Token } from "src/types/tokens";
import { PortfolioHeader } from "src/components/Portfolio/PortfolioHeader";

enum SectionEnum {
  AssetPnl = "Asset PnL",
  OtherStats = "Other Stats",
  OpenPositions = "Open Positions",
  ClosedPositions = "Closed Positions",
  OpenOrders = "Open Orders",
}

export default function Portfolio() {
  const [selectedAssets, setSelectedAssets] = useState<Token[]>([]);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAssetPnlSection, setShowAssetPnlSection] = useState(false);
  const [showOtherStatsTable, setShowOtherStatsTable] = useState(false);
  const [showOpenPositionsSection, setShowOpenPositionsSection] = useState(false);
  const [showClosedPositionsSection, setShowClosedPositionsSection] = useState(false);
  const [showOpenOrdersSection, setShowOpenOrdersSection] = useState(false);

  const SHOW_SECTIONS_STATE_MAP = {
    [SectionEnum.AssetPnl]: { state: showAssetPnlSection, func: setShowAssetPnlSection },
    [SectionEnum.OtherStats]: { state: showOtherStatsTable, func: setShowOtherStatsTable },
    [SectionEnum.OpenPositions]: { state: showOpenPositionsSection, func: setShowOpenPositionsSection },
    [SectionEnum.ClosedPositions]: { state: showClosedPositionsSection, func: setShowClosedPositionsSection },
    [SectionEnum.OpenOrders]: { state: showOpenOrdersSection, func: setShowOpenOrdersSection },
  };

  const data: any = useParams();
  const { chainId } = useChainId();
  const { id: address } = data;
  if (!address) {
    return <Redirect to="/" />;
  }
  const tokens: Token[] = getTokens(chainId);

  const handleShowAllAssets = () => {
    setShowAllAssets(true);
  };

  const handleHideAllAssets = () => {
    setShowAllAssets(false);
  };

  const updateSelectedAssets = (asset: Token) => {
    if (selectedAssets.includes(asset)) {
      setSelectedAssets(selectedAssets.filter((token) => token !== asset));
    } else {
      setSelectedAssets([...selectedAssets, asset]);
    }
  };

  const handleToggleSection = (SectionType: SectionEnum) => {
    const state = SHOW_SECTIONS_STATE_MAP[SectionType].state;
    const setShowSection = SHOW_SECTIONS_STATE_MAP[SectionType].func;
    setShowSection(!state);
  };

  return (
    <Styled.PortfolioContainer>
      <PortfolioHeader
        address={address}
        tokens={tokens}
        selectedAssets={selectedAssets}
        showAllAssets={showAllAssets}
        handleShowAllAssets={handleShowAllAssets}
        handleHideAllAssets={handleHideAllAssets}
        updateSelectedAssets={updateSelectedAssets}
      />
      <Styled.SectionGrid>
        <Styled.LeftSide>
          <Styled.SectionContainer>
            <Styled.SectionHeading onClick={() => handleToggleSection(SectionEnum.AssetPnl)}>
              <Styled.SectionLabel>Asset PnL</Styled.SectionLabel>
              <Styled.ChevronDown isActive={showAssetPnlSection} />
            </Styled.SectionHeading>
          </Styled.SectionContainer>
        </Styled.LeftSide>
        <Styled.RightSide>
          <Styled.SectionContainer>
            <Styled.SectionHeading onClick={() => handleToggleSection(SectionEnum.OpenPositions)}>
              <Styled.SectionLabel>Open Positions</Styled.SectionLabel>
              <Styled.ChevronDown isActive={showOpenPositionsSection} />
            </Styled.SectionHeading>
            <OpenPositionsTable />
          </Styled.SectionContainer>

          <Styled.SectionContainer>
            <Styled.SectionHeading onClick={() => handleToggleSection(SectionEnum.ClosedPositions)}>
              <Styled.SectionLabel>Closed Positions</Styled.SectionLabel>
              <Styled.ChevronDown isActive={showClosedPositionsSection} />
            </Styled.SectionHeading>
          </Styled.SectionContainer>

          <Styled.SectionContainer>
            <Styled.SectionHeading onClick={() => handleToggleSection(SectionEnum.OpenOrders)}>
              <Styled.SectionLabel>Open Orders</Styled.SectionLabel>
              <Styled.ChevronDown isActive={showOpenOrdersSection} />
            </Styled.SectionHeading>
          </Styled.SectionContainer>
        </Styled.RightSide>
      </Styled.SectionGrid>
    </Styled.PortfolioContainer>
  );
}

const tradeTableHeadings = ["ENTRY (USD)", "SIDE", "LEVERAGE", "ASSET", "NOTIONAL (USD)", "COLLATERAL (USD)", "PNL"];

export const OpenPositionsTable = () => (
  <Styled.TradeTable>
    <thead>
      <tr>
        {tradeTableHeadings.map((heading, i) => (
          <Styled.TradeTableHeading key={heading} rightAlign={i === tradeTableHeadings.length - 1}>
            {heading}
          </Styled.TradeTableHeading>
        ))}
      </tr>
    </thead>
  </Styled.TradeTable>
);
