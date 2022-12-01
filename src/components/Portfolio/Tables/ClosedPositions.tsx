import { FC } from "react";
import { PortfolioTable, PositionRow } from "src/components/Portfolio/PortfolioTable";
import { Position, Side } from "src/types/portfolio";

const closedPositionsTableHeadings = [
  "ENTRY (USD)",
  "EXIT (USD)",
  "SIDE",
  "LEVERAGE",
  "ASSET",
  "NOTIONAL (USD)",
  "COLLATERAL (USD)",
  "PNL",
];

interface ClosedPositionsTableProps {
  data: Position[];
}

export const ClosedPositionsTable: FC<ClosedPositionsTableProps> = ({ data }) => (
  <PortfolioTable headings={closedPositionsTableHeadings}>
    {data.map(
      (
        {
          entryTime,
          entryDate,
          entryPrice,
          exitTime,
          exitDate,
          exitPrice,
          side,
          leverage,
          asset,
          notionalUsd,
          collateralUsd,
          pnl,
        },
        i
      ) => (
        <PositionRow
          key={i}
          entryTime={entryTime}
          entryDate={entryDate}
          entryPrice={entryPrice}
          exitTime={exitTime}
          exitDate={exitDate}
          exitPrice={exitPrice}
          side={side as Side}
          leverage={leverage}
          asset={asset}
          notionalUsd={notionalUsd}
          collateralUsd={collateralUsd}
          pnl={pnl}
        />
      )
    )}
  </PortfolioTable>
);
