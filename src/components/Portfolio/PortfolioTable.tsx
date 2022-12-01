import { FC, ReactNode } from "react";
import * as Styled from "src/views/Portfolio/Portfolio.styles";
import { OpenOrder, Side } from "src/types/portfolio";
import positionUpIcon from "src/img/arrow-circle-up.svg";
import positionDownIcon from "src/img/arrow-circle-down.svg";

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

interface PositionRowProps {
  entryTime: string;
  entryDate: string;
  entryPrice: number;
  exitTime?: string;
  exitDate?: string;
  exitPrice?: number;
  side: Side;
  asset: string;
  leverage: number;
  notionalUsd: number;
  collateralUsd: number;
  pnl: number;
}

export const PositionRow: FC<PositionRowProps> = ({
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
}) => (
  <Styled.TableRow>
    <Styled.TableCell>
      <Styled.FlexRow>
        <Styled.DateTimeLabel>{entryTime}</Styled.DateTimeLabel>
        <Styled.DateTimeLabel>{entryDate}</Styled.DateTimeLabel>
      </Styled.FlexRow>
      <span>{entryPrice}</span>
    </Styled.TableCell>
    {exitTime && exitDate && exitPrice && (
      <Styled.TableCell>
        <Styled.FlexRow>
          <Styled.DateTimeLabel>{exitTime}</Styled.DateTimeLabel>
          <Styled.DateTimeLabel>{exitDate}</Styled.DateTimeLabel>
        </Styled.FlexRow>
        <span>{exitPrice}</span>
      </Styled.TableCell>
    )}
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
    <Styled.PnlCell>
      <Styled.FlexRowEnd alignCenter wrap>
        <img src={positionUpIcon} alt="position up" />
        <span>1.12%</span>
        <span>{pnl}</span>
        {/* Change to calculation later */}
      </Styled.FlexRowEnd>
    </Styled.PnlCell>
  </Styled.TableRow>
);

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
