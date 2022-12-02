import { FC } from "react";
import { OpenOrderRow, PortfolioTable } from "src/components/Portfolio/PortfolioTable";
import { Order, SideEnum } from "src/types/portfolio";
import { Token } from "src/types/tokens";

const openOrdersTableHeadings = ["TRIGGER PRICE (USD)", "TYPE", "SIDE", "ASSET", "AMOUNT (USD)", ""];

interface OpenOrdersTableProps {
  data: Order[];
  tokens: Token[];
}

export const OpenOrdersTable: FC<OpenOrdersTableProps> = ({ data, tokens }) => (
  <PortfolioTable headings={openOrdersTableHeadings}>
    {data.map(({ indexToken, collateralDelta, sizeDelta, isLong, triggerPrice, triggerAboveThreshold, type }) => (
      <OpenOrderRow
        key={`${sizeDelta.toString()}${collateralDelta}`}
        indexToken={indexToken}
        triggerPrice={triggerPrice}
        side={(isLong ? "Long" : "Short") as SideEnum}
        collateralDelta={collateralDelta}
        sizeDelta={sizeDelta}
        triggerAboveThreshold={triggerAboveThreshold}
        type={type}
        assetIcon={tokens.find((token) => token.address === indexToken)?.imageUrl}
        assetSymbol={tokens.find((token) => token.address === indexToken)?.symbol}
      />
    ))}
  </PortfolioTable>
);
