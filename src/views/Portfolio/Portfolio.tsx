import { Redirect, useParams } from "react-router-dom";
import * as Styled from "./Portfolio.styles";
import { useChainId } from "src/Helpers";
import { getTokens } from "src/data/Tokens";
import { useEffect, useState } from "react";
import { Token } from "src/types/tokens";
import { PortfolioHeader } from "src/components/Portfolio/PortfolioHeader";
import { OpenPositionsTable } from "src/components/Portfolio/Tables/OpenPositions";
import {
  closedPositionsDummyData,
  openOrdersDummyData,
  openPositionsDummyData,
  otherStatsDummyData,
} from "src/views/Portfolio/sampleData";
import { ClosedPositionsTable } from "src/components/Portfolio/Tables/ClosedPositions";
import { OpenOrdersTable } from "src/components/Portfolio/Tables/OpenOrders";
import { OtherStatsTable } from "src/components/Portfolio/Tables/OtherStats";
import assetPnlPlaceholder from "src/img/temp/asset-pnl-placeholder.png";
import { PortfolioPeriod, PortfolioPeriodEnum } from "src/types/portfolio";

enum SectionEnum {
  AssetPnl = "Asset PnL",
  OtherStats = "Other Stats",
  OpenPositions = "Open Positions",
  ClosedPositions = "Closed Positions",
  OpenOrders = "Open Orders",
}

const INACTIVE_TOKENS = ["USDC", "USDT", "DAI", "FRAX"];

export default function Portfolio() {
  const [selectedAssets, setSelectedAssets] = useState<Token[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PortfolioPeriod>(PortfolioPeriodEnum.Day);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAssetPnlSection, setShowAssetPnlSection] = useState(true);
  const [showOtherStatsTable, setShowOtherStatsTable] = useState(true);
  const [showOpenPositionsSection, setShowOpenPositionsSection] = useState(true);
  const [showClosedPositionsSection, setShowClosedPositionsSection] = useState(true);
  const [showOpenOrdersSection, setShowOpenOrdersSection] = useState(true);

  const { chainId } = useChainId();
  const tokens: Token[] = getTokens(chainId);
  const filteredTokens = tokens.filter((token) => !INACTIVE_TOKENS.includes(token.symbol));

  const SHOW_SECTIONS_STATE_MAP = {
    [SectionEnum.AssetPnl]: { state: showAssetPnlSection, func: setShowAssetPnlSection },
    [SectionEnum.OtherStats]: { state: showOtherStatsTable, func: setShowOtherStatsTable },
    [SectionEnum.OpenPositions]: { state: showOpenPositionsSection, func: setShowOpenPositionsSection },
    [SectionEnum.ClosedPositions]: { state: showClosedPositionsSection, func: setShowClosedPositionsSection },
    [SectionEnum.OpenOrders]: { state: showOpenOrdersSection, func: setShowOpenOrdersSection },
  };

  useEffect(() => {
    if (filteredTokens?.length) {
      setSelectedAssets([filteredTokens[0]]);
    }
  }, [filteredTokens]);

  const data: any = useParams();
  const { id: address } = data;
  if (!address) {
    return <Redirect to="/" />;
  }

  const handleShowAllAssets = () => {
    setShowAllAssets(true);
  };

  const handleHideAllAssets = () => {
    setShowAllAssets(false);
  };

  const updateSelectedAssets = (asset: Token) => {
    if (selectedAssets.includes(asset)) {
      setSelectedAssets(selectedAssets.filter((token) => token.symbol !== asset.symbol));
    } else {
      setSelectedAssets([...selectedAssets, asset]);
    }
  };

  const handleToggleSection = (SectionType: SectionEnum) => {
    const state = SHOW_SECTIONS_STATE_MAP[SectionType].state;
    const setShowSection = SHOW_SECTIONS_STATE_MAP[SectionType].func;
    setShowSection(!state);
  };

  const handlePeriodChange = (period: PortfolioPeriodEnum) => {
    setSelectedPeriod(period);
  };

  return (
    <Styled.PortfolioContainer>
      <PortfolioHeader
        address={address}
        tokens={filteredTokens}
        selectedAssets={selectedAssets}
        selectedPeriod={selectedPeriod}
        showAllAssets={showAllAssets}
        handleShowAllAssets={handleShowAllAssets}
        handleHideAllAssets={handleHideAllAssets}
        updateSelectedAssets={updateSelectedAssets}
        handlePeriodChange={handlePeriodChange}
      />
      <Styled.SectionGrid>
        <Styled.LeftSide>
          <Styled.SectionContainer>
            <Styled.SectionHeading onClick={() => handleToggleSection(SectionEnum.AssetPnl)}>
              <Styled.SectionLabel>Asset PnL</Styled.SectionLabel>
              <Styled.ChevronDown isActive={showAssetPnlSection} />
            </Styled.SectionHeading>
            {showAssetPnlSection && <img src={assetPnlPlaceholder} width="100%" height="100%" alt="temp placeholder" />}
          </Styled.SectionContainer>
          <Styled.SectionContainer>
            <Styled.SectionHeading onClick={() => handleToggleSection(SectionEnum.AssetPnl)}>
              <Styled.SectionLabel>Other Stats</Styled.SectionLabel>
              <Styled.ChevronDown isActive={showOtherStatsTable} />
            </Styled.SectionHeading>
            {showOtherStatsTable && <OtherStatsTable data={otherStatsDummyData} />}
          </Styled.SectionContainer>
        </Styled.LeftSide>
        <Styled.RightSide>
          <Styled.SectionContainer>
            <Styled.SectionHeading onClick={() => handleToggleSection(SectionEnum.OpenPositions)}>
              <Styled.FlexRow>
                <Styled.SectionLabel>Open Positions</Styled.SectionLabel>
                {openPositionsDummyData?.length && (
                  <Styled.IndicatorBadge>{openPositionsDummyData.length}</Styled.IndicatorBadge>
                )}
              </Styled.FlexRow>
              <Styled.ChevronDown isActive={showOpenPositionsSection} />
            </Styled.SectionHeading>
            {showOpenPositionsSection && <OpenPositionsTable data={openPositionsDummyData} />}
          </Styled.SectionContainer>

          <Styled.SectionContainer>
            <Styled.SectionHeading onClick={() => handleToggleSection(SectionEnum.ClosedPositions)}>
              <Styled.FlexRow>
                <Styled.SectionLabel>Closed Positions</Styled.SectionLabel>
                {openPositionsDummyData?.length && (
                  <Styled.IndicatorBadge>{openPositionsDummyData.length}</Styled.IndicatorBadge>
                )}
              </Styled.FlexRow>
              <Styled.ChevronDown isActive={showClosedPositionsSection} />
            </Styled.SectionHeading>
            {showClosedPositionsSection && <ClosedPositionsTable data={closedPositionsDummyData} />}
          </Styled.SectionContainer>

          <Styled.SectionContainer>
            <Styled.SectionHeading onClick={() => handleToggleSection(SectionEnum.OpenOrders)}>
              <Styled.FlexRow>
                <Styled.SectionLabel>Open Orders</Styled.SectionLabel>
                {openOrdersDummyData?.length && (
                  <Styled.IndicatorBadge>{openOrdersDummyData.length}</Styled.IndicatorBadge>
                )}
              </Styled.FlexRow>
              <Styled.ChevronDown isActive={showOpenOrdersSection} />
            </Styled.SectionHeading>
            {showOpenOrdersSection && <OpenOrdersTable data={openOrdersDummyData} />}
          </Styled.SectionContainer>
        </Styled.RightSide>
      </Styled.SectionGrid>
      <Styled.SectionContainer>
        <Styled.SectionHeading onClick={() => handleToggleSection(SectionEnum.OpenOrders)}>
          <Styled.FlexRow alignCenter>
            <Styled.SectionLabel>Trading View</Styled.SectionLabel>
            {selectedAssets?.length &&
              selectedAssets.map((token: Token) => (
                <Styled.AssetButton>
                  {token.imageUrl && <img src={token.imageUrl} alt={token.symbol} />}
                  <span>{token.symbol}</span>
                </Styled.AssetButton>
              ))}
            <Styled.FullScreenButton>Full Screen View</Styled.FullScreenButton>
          </Styled.FlexRow>
          <Styled.ChevronDown isActive={showOpenOrdersSection} />
        </Styled.SectionHeading>
        {showOpenOrdersSection && <></>}
      </Styled.SectionContainer>
    </Styled.PortfolioContainer>
  );
}
