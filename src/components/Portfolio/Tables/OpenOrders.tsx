import { FC } from "react";
import { OpenOrderRow, PortfolioTable } from "src/components/Portfolio/PortfolioTable";
import { OpenOrder, Side } from "src/types/portfolio";

const openOrdersTableHeadings = [
  "TRIGGER PRICE",
  "TYPE",
  "SIDE",
  "LEVERAGE",
  "ASSET",
  "NOTIONAL (USD)",
  "COLLATERAL (USD)",
  "",
];

interface OpenOrdersTableProps {
  data: OpenOrder[];
}

export const OpenOrdersTable: FC<OpenOrdersTableProps> = ({ data }) => (
  <PortfolioTable headings={openOrdersTableHeadings}>
    {data.map(({ triggerPrice, type, side, leverage, asset, notionalUsd, collateralUsd }, i) => (
      <OpenOrderRow
        key={i}
        triggerPrice={triggerPrice}
        type={type}
        side={side as Side}
        leverage={leverage}
        asset={asset}
        notionalUsd={notionalUsd}
        collateralUsd={collateralUsd}
      />
    ))}
  </PortfolioTable>
);
