import { FC } from "react";
import { PortfolioTable, PositionRow } from "src/components/Portfolio/PortfolioTable";
import { Position, Side } from "src/types/portfolio";

const openPositionsTableHeadings = [
  "ENTRY (USD)",
  "SIDE",
  "LEVERAGE",
  "ASSET",
  "NOTIONAL (USD)",
  "COLLATERAL (USD)",
  "PNL",
];

interface OpenPositionsTableProps {
  data: Position[];
}

export const OpenPositionsTable: FC<OpenPositionsTableProps> = ({ data }) => (
  <PortfolioTable headings={openPositionsTableHeadings}>
    {data.map(({ entryTime, entryDate, entryPrice, side, leverage, asset, notionalUsd, collateralUsd, pnl }, i) => (
      <PositionRow
        key={i}
        entryTime={entryTime}
        entryDate={entryDate}
        entryPrice={entryPrice}
        side={side as Side}
        leverage={leverage}
        asset={asset}
        notionalUsd={notionalUsd}
        collateralUsd={collateralUsd}
        pnl={pnl}
      />
    ))}
  </PortfolioTable>
);
