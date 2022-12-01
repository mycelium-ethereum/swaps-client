import { FC } from "react";
import { PortfolioTable, StatsRow } from "src/components/Portfolio/PortfolioTable";
import { OtherStat } from "src/types/portfolio";

const otherStatsTableHeadings = ["TOTAL VOLUME (USD)", "WIN %", "NUMBER OF TRADES", "TOTAL FEES", "AVERAGE LEVERAGE"];

interface OtherStatsTableProps {
  data: OtherStat[];
}

export const OtherStatsTable: FC<OtherStatsTableProps> = ({ data }) => (
  <PortfolioTable headings={otherStatsTableHeadings} noRightAlign>
    {data.map(({ totalVolume, winRate, numTrades, totalFees, averageLeverage }, i) => (
      <StatsRow
        key={i}
        totalVolume={totalVolume}
        winRate={winRate}
        numTrades={numTrades}
        totalFees={totalFees}
        averageLeverage={averageLeverage}
      />
    ))}
  </PortfolioTable>
);
