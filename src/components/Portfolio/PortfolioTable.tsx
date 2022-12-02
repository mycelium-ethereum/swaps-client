import { FC, ReactNode } from "react";
import * as Styled from "src/views/Portfolio/Portfolio.styles";
import { OpenOrder, Position, SideEnum } from "src/types/portfolio";
import positionUpIcon from "src/img/arrow-circle-up.svg";
import positionDownIcon from "src/img/arrow-circle-down.svg";
import { bigNumberify, formatAmount, USD_DECIMALS } from "src/Helpers";
import { getPnl } from "src/utils/portfolio";

const ETH_DEFAULT_ICON = "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880";

interface PortfolioTableProps {
  noRightAlign?: boolean;
  headings: string[];
  children: ReactNode;
}

export const PortfolioTable: FC<PortfolioTableProps> = ({ noRightAlign, headings, children }) => (
  <Styled.PortfolioTable>
    <thead>
      <tr>
        {headings.map((heading, i) => (
          <Styled.PortfolioTableHeading key={heading} rightAlign={i === headings.length - 1 && !noRightAlign}>
            {heading}
          </Styled.PortfolioTableHeading>
        ))}
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </Styled.PortfolioTable>
);

interface PositionRowProps extends Omit<Position, "asset"> {
  assetIcon?: string;
  assetSymbol?: string;
}

export const PositionRow: FC<PositionRowProps> = ({
  side,
  size,
  collateral,
  liquidationPrice,
  leverage,
  assetIcon,
  assetSymbol,
  averageEntryPrice,
  currentPrice,
}) => {
  const { isUp, percentage, amount } = getPnl(side === SideEnum.Short, averageEntryPrice, currentPrice, size);

  return (
    <Styled.TableRow>
      <Styled.TableCell>
        {/* <Styled.FlexRow>
        <Styled.DateTimeLabel>{entryTime}</Styled.DateTimeLabel>
        <Styled.DateTimeLabel>{entryDate}</Styled.DateTimeLabel>
      </Styled.FlexRow> */}
        <span>${formatAmount(averageEntryPrice, USD_DECIMALS, 2, true)}</span>
      </Styled.TableCell>
      {/* {exitTime && exitDate && exitPrice && (
      <Styled.TableCell>
        <Styled.FlexRow>
          <Styled.DateTimeLabel>{exitTime}</Styled.DateTimeLabel>
          <Styled.DateTimeLabel>{exitDate}</Styled.DateTimeLabel>
        </Styled.FlexRow>
        <span>{exitPrice}</span>
      </Styled.TableCell>
    )} */}
      <Styled.TableCell>
        <span>${formatAmount(liquidationPrice, USD_DECIMALS, 2, true)}</span>
      </Styled.TableCell>
      <Styled.TableCell>
        <Styled.SideLabel isShort={side === SideEnum.Short}>{side}</Styled.SideLabel>
      </Styled.TableCell>
      <Styled.TableCell>
        <span>{parseFloat(leverage).toFixed(1)}x</span>
      </Styled.TableCell>
      <Styled.TableCell>
        <Styled.AssetIcon src={assetIcon || ETH_DEFAULT_ICON} alt={assetSymbol || "ETH"} />
      </Styled.TableCell>
      <Styled.TableCell>
        <span>${formatAmount(size, USD_DECIMALS, 2, true)}</span>
      </Styled.TableCell>
      <Styled.TableCell>
        <span>${formatAmount(collateral, USD_DECIMALS, 2, true)}</span>
      </Styled.TableCell>
      <Styled.PnlCell isDown={isUp}>
        <Styled.FlexRowEnd alignCenter wrap>
          <img src={positionUpIcon} alt="position up" className="position-up-arrow" />
          <img src={positionDownIcon} alt="position up" className="position-down-arrow" />
          <span>{percentage.toNumber()}%</span>
          <span>{`${!isUp ? "" : "-"}$${formatAmount(amount, USD_DECIMALS, 2, true)}`}</span>
        </Styled.FlexRowEnd>
      </Styled.PnlCell>
    </Styled.TableRow>
  );
};

interface OpenOrderRowProps extends OpenOrder {}

export const OpenOrderRow: FC<OpenOrderRowProps> = ({
  triggerPrice,
  type,
  side,
  leverage,
  asset,
  notionalUsd,
  collateralUsd,
}) => (
  <Styled.TableRow>
    <Styled.TableCell>{triggerPrice}</Styled.TableCell>
    <Styled.TableCell>{type}</Styled.TableCell>
    <Styled.TableCell>
      <Styled.SideLabel isShort={side === "Short"}>{side}</Styled.SideLabel>
    </Styled.TableCell>
    <Styled.TableCell>
      <span>{leverage}x</span>
    </Styled.TableCell>
    <Styled.TableCell>
      {/* {asset} */}
      <Styled.AssetIcon src="https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880" alt="ETH" />
    </Styled.TableCell>
    <Styled.TableCell>
      <span>{notionalUsd}</span>
    </Styled.TableCell>
    <Styled.TableCell>
      <span>{collateralUsd}</span>
    </Styled.TableCell>
    {/* Empty cell */}
    <Styled.TableCell />
  </Styled.TableRow>
);

interface StatsRowProps {
  totalVolume: number;
  winRate: number;
  numTrades: number;
  totalFees: number;
  averageLeverage: number;
}

export const StatsRow: FC<StatsRowProps> = ({ totalVolume, winRate, numTrades, totalFees, averageLeverage }) => (
  <Styled.TableRow>
    <Styled.TableCell>{totalVolume}</Styled.TableCell>
    <Styled.TableCell>
      <Styled.WinRateLabel aboveSixtyPercent={winRate > 60}>{winRate}%</Styled.WinRateLabel>
    </Styled.TableCell>
    <Styled.TableCell>{numTrades}</Styled.TableCell>
    <Styled.TableCell>{totalFees}</Styled.TableCell>
    <Styled.TableCell>{averageLeverage}x</Styled.TableCell>
  </Styled.TableRow>
);
