import { FC } from "react";
import { PortfolioTable, PositionRow } from "src/components/Portfolio/PortfolioTable";
import { Position, Side } from "src/types/portfolio";
import { Token } from "src/types/tokens";

const openPositionsTableHeadings = [
  "PRICE (USD)",
  "CURRENT (USD)",
  "SIDE",
  "OPENING LEVERAGE",
  "ASSET",
  "AMOUNT (USD)",
  "PNL (USD)",
];
// Notional and collateral. Entry and liquidation price, pnl

interface OpenPositionsTableProps {
  data: Position[];
  tokens: Token[];
}

export const OpenPositionsTable: FC<OpenPositionsTableProps> = ({ data, tokens }) => (
  <PortfolioTable headings={openPositionsTableHeadings}>
    {data.map(({ side, size, collateral, liquidationPrice, leverage, asset, averageEntryPrice, currentPrice }, i) => (
      <PositionRow
        key={size.toString()}
        side={side as Side}
        size={size}
        collateral={collateral}
        liquidationPrice={liquidationPrice}
        leverage={leverage}
        assetIcon={tokens.find((token) => token.address === asset)?.imageUrl}
        assetSymbol={tokens.find((token) => token.address === asset)?.symbol}
        averageEntryPrice={averageEntryPrice}
        currentPrice={currentPrice}
      />
    ))}
  </PortfolioTable>
);
