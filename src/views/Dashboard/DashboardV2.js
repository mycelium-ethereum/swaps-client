import { useWeb3React } from "@web3-react/core";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import useSWR from "swr";
import TooltipComponent from "../../components/Tooltip/Tooltip";

import { ethers } from "ethers";
import hexToRgba from "hex-to-rgba";

import { currentFortnight, SECONDS_PER_WEEK } from "../../data/Fees";
import { getWhitelistedTokens } from "../../data/Tokens";

import {
  useFees,
  useFeesSince,
  useMYCPrice,
  useSpreadCaptureVolume,
  useStakingApr,
  useTotalMYCInLiquidity,
  useTotalMYCSupply,
  useTotalStaked,
} from "../../Api";
import {
  ARBITRUM,
  ARBITRUM_GOERLI,
  BASIS_POINTS_DIVISOR,
  bigNumberify,
  DEFAULT_MAX_USDG_AMOUNT,
  ETH_DECIMALS,
  expandDecimals,
  fetcher,
  formatAmount,
  formatDate,
  formatKeyAmount,
  getChainName,
  getPageTitle,
  MLP_DECIMALS,
  MLP_POOL_COLORS,
  MYC_DECIMALS,
  USD_DECIMALS,
  useChainId,
} from "../../Helpers";

import { getContract } from "../../Addresses";

import MlpManager from "../../abis/MlpManager.json";
import ReaderV2 from "../../abis/ReaderV2.json";
import VaultV2 from "../../abis/VaultV2.json";

import "./DashboardV2.css";

import arbitrum16Icon from "../../img/ic_arbitrum_16.svg";
import arbitrum24Icon from "../../img/ic_arbitrum_24.svg";
import mlp40Icon from "../../img/ic_mlp_40.svg";
import mycToken from "../../img/ic_myc.svg";

import { ADDRESS_ZERO } from "@uniswap/v3-sdk";
import { useInfoTokens } from "src/hooks/useInfoTokens";
import { getServerUrl } from "src/lib";
import SEO from "../../components/Common/SEO";
import AssetDropdown from "./AssetDropdown";

const { AddressZero } = ethers.constants;

export const getUnclaimedFees = (tokenAddresses, infoTokens, fees) => {
  if (!fees || !infoTokens) {
    return bigNumberify(0);
  }

  let currentFeesUsd = bigNumberify(0);
  for (let i = 0; i < tokenAddresses.length; i++) {
    const tokenAddress = tokenAddresses[i];
    const tokenInfo = infoTokens[tokenAddress];
    if (!tokenInfo || !tokenInfo.contractMinPrice) {
      continue;
    }

    const feeUsd = fees[i].mul(tokenInfo.contractMinPrice).div(expandDecimals(1, tokenInfo.decimals));
    currentFeesUsd = currentFeesUsd.add(feeUsd);
  }

  return currentFeesUsd;
};

export default function DashboardV2() {
  const { active, library } = useWeb3React();
  const { chainId } = useChainId();

  const chainName = getChainName(chainId);

  const positionStatsUrl = getServerUrl(chainId, "/positionStats");
  const { data: positionStats } = useSWR([positionStatsUrl], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  const mycTotalVolumeUrl = getServerUrl(chainId, "/volume");
  const { data: mycTotalVolume } = useSWR([mycTotalVolumeUrl], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  let { total: mycSupply, circulating: circulatingMYCSupply } = useTotalMYCSupply();

  let totalLongPositionSizes;
  let totalShortPositionSizes;
  if (positionStats && positionStats.totalLongPositionSizes && positionStats.totalShortPositionSizes) {
    totalLongPositionSizes = bigNumberify(positionStats.totalLongPositionSizes);
    totalShortPositionSizes = bigNumberify(positionStats.totalShortPositionSizes);
  }

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);
  const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);

  const readerAddress = getContract(chainId, "Reader");
  const vaultAddress = getContract(chainId, "Vault");
  const mlpManagerAddress = getContract(chainId, "MlpManager");

  const mycAddress = getContract(chainId, "MYC");
  const mlpAddress = getContract(chainId, "MLP");
  const usdgAddress = getContract(chainId, "USDG");

  const tokensForSupplyQuery = [mycAddress, mlpAddress, usdgAddress];

  const { data: aums } = useSWR([`Dashboard:getAums:${active}`, chainId, mlpManagerAddress, "getAums"], {
    fetcher: fetcher(library, MlpManager),
  });

  const { data: fees } = useSWR([`Dashboard:fees:${active}`, chainId, readerAddress, "getFees", vaultAddress], {
    fetcher: fetcher(library, ReaderV2, [whitelistedTokenAddresses]),
  });

  const { data: totalSupplies } = useSWR(
    [`Dashboard:totalSupplies:${active}`, chainId, readerAddress, "getTokenBalancesWithSupplies", AddressZero],
    {
      fetcher: fetcher(library, ReaderV2, [tokensForSupplyQuery]),
    }
  );

  const { data: totalTokenWeights } = useSWR(
    [`MlpSwap:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
    {
      fetcher: fetcher(library, VaultV2),
    }
  );

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  const allFees = useFees(chainId);

  // const feeHistory = getFeeHistory(chainId);

  const from = currentFortnight;
  // feeHistory[0]?.to;
  const to = from + SECONDS_PER_WEEK * 2;
  const currentGraphFees = useFeesSince(chainId, from, to);
  const currentUnclaimedFees = getUnclaimedFees(whitelistedTokenAddresses, infoTokens, fees);
  let totalCurrentFees;
  if (currentUnclaimedFees && currentGraphFees) {
    totalCurrentFees = currentUnclaimedFees.gt(currentGraphFees) ? currentUnclaimedFees : currentGraphFees;
  }

  let totalFeesDistributed;
  if (allFees) {
    totalFeesDistributed = bigNumberify(allFees.mint)
      .add(allFees.burn)
      .add(allFees.marginAndLiquidation)
      .add(allFees.swap);
  }

  const totalMMFees = useSpreadCaptureVolume(chainId);

  let totalFees;
  totalFees = totalFeesDistributed;
  // if (totalFeesDistributed && totalMMFees) {
  //   totalFees = totalFeesDistributed.add(totalMMFees);
  // }

  const { mycPrice, mycPriceFromMainnet, mycPriceFromArbitrum } = useMYCPrice(
    chainId,
    { arbitrum: chainId === ARBITRUM ? library : undefined },
    active
  );

  const ethToken = infoTokens[ADDRESS_ZERO];
  const ethPrice = ethToken.maxPrice;

  let { mainnet: totalMYCInLiquidityMainnet, arbitrum: totalMYCInLiquidityArbitrum } = useTotalMYCInLiquidity(
    chainId,
    active
  );

  let mycMarketCap;
  if (mycPrice && circulatingMYCSupply) {
    mycMarketCap = mycPrice.mul(circulatingMYCSupply).div(expandDecimals(1, MYC_DECIMALS));
  }

  let mycFullyDilutedMarketCap;
  if (mycPrice && mycSupply) {
    mycFullyDilutedMarketCap = mycPrice.mul(mycSupply).div(expandDecimals(1, MYC_DECIMALS));
  }

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  let mlpPrice;
  let mlpSupply;
  let mlpMarketCap;
  if (aum && totalSupplies && totalSupplies[3]) {
    mlpSupply = totalSupplies[3];
    mlpPrice =
      aum && aum.gt(0) && mlpSupply.gt(0)
        ? aum.mul(expandDecimals(1, MLP_DECIMALS)).div(mlpSupply)
        : expandDecimals(1, USD_DECIMALS);
    mlpMarketCap = mlpPrice.mul(mlpSupply).div(expandDecimals(1, MLP_DECIMALS));
  }

  const stakingApr = useStakingApr(mycPrice, ethPrice);
  const totalStakedMyc = useTotalStaked();

  const stakingTvl = useMemo(() => {
    if (!mycPrice || !totalStakedMyc) return bigNumberify(0);
    return mycPrice.mul(totalStakedMyc);
  }, [mycPrice, totalStakedMyc]);

  const tvl = aum?.add(stakingTvl);

  let adjustedUsdgSupply = bigNumberify(0);

  for (let i = 0; i < tokenList.length; i++) {
    const token = tokenList[i];
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo && tokenInfo.usdgAmount) {
      adjustedUsdgSupply = adjustedUsdgSupply.add(tokenInfo.usdgAmount);
    }
  }

  const getWeightText = (tokenInfo) => {
    if (
      !tokenInfo.weight ||
      !tokenInfo.usdgAmount ||
      !adjustedUsdgSupply ||
      adjustedUsdgSupply.eq(0) ||
      !totalTokenWeights
    ) {
      return "...";
    }

    const currentWeightBps = tokenInfo.usdgAmount.mul(BASIS_POINTS_DIVISOR).div(adjustedUsdgSupply);
    const targetWeightBps = tokenInfo.weight.mul(BASIS_POINTS_DIVISOR).div(totalTokenWeights);

    const weightText = `${formatAmount(currentWeightBps, 2, 2, false)}% / ${formatAmount(
      targetWeightBps,
      2,
      2,
      false
    )}%`;

    return (
      <TooltipComponent
        handle={weightText}
        position="right-bottom"
        renderContent={() => {
          return (
            <>
              Current Weight: {formatAmount(currentWeightBps, 2, 2, false)}%<br />
              Target Weight: {formatAmount(targetWeightBps, 2, 2, false)}%<br />
              <br />
              {currentWeightBps.lt(targetWeightBps) && (
                <div>
                  {tokenInfo.symbol} is below its target weight.
                  <br />
                  <br />
                  Get lower fees to{" "}
                  <Link to="/buy_mlp" target="_blank" rel="noopener noreferrer">
                    buy MLP
                  </Link>{" "}
                  with {tokenInfo.symbol},&nbsp; and to{" "}
                  <Link to="/" target="_blank" rel="noopener noreferrer">
                    swap
                  </Link>{" "}
                  {tokenInfo.symbol} for other tokens.
                </div>
              )}
              {currentWeightBps.gt(targetWeightBps) && (
                <div>
                  {tokenInfo.symbol} is above its target weight.
                  <br />
                  <br />
                  Get lower fees to{" "}
                  <Link to="/" target="_blank" rel="noopener noreferrer">
                    swap
                  </Link>{" "}
                  tokens for {tokenInfo.symbol}.
                </div>
              )}
              <br />
              <div>
                <a
                  href="https://swaps.docs.mycelium.xyz/protocol-design/mycelium-liquidity-pool-mlp/mlp-mechanism"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  More Info
                </a>
              </div>
            </>
          );
        }}
      />
    );
  };
  const equaliseValue = (item) => {
    return item.div(expandDecimals(1, ETH_DECIMALS)).toNumber();
  };

  const formatPercentage = (value) => {
    return parseFloat((value * 100).toFixed(2));
  };

  let stakedPercent = 0;
  if (circulatingMYCSupply && !circulatingMYCSupply.isZero() && totalStakedMyc) {
    stakedPercent = totalStakedMyc.toNumber() / equaliseValue(circulatingMYCSupply);
    stakedPercent = formatPercentage(stakedPercent);
  }

  let arbitrumLiquidityPercent = 0;
  if (circulatingMYCSupply && !circulatingMYCSupply.isZero() && totalMYCInLiquidityArbitrum) {
    arbitrumLiquidityPercent = equaliseValue(totalMYCInLiquidityArbitrum) / equaliseValue(circulatingMYCSupply);
    arbitrumLiquidityPercent = formatPercentage(arbitrumLiquidityPercent);
  }

  let mainnetLiquidityPercent = 0;
  if (circulatingMYCSupply && !circulatingMYCSupply.isZero() && totalMYCInLiquidityMainnet) {
    mainnetLiquidityPercent = equaliseValue(totalMYCInLiquidityMainnet) / equaliseValue(circulatingMYCSupply);
    mainnetLiquidityPercent = formatPercentage(mainnetLiquidityPercent);
  }

  let notStakedPercent = parseFloat(
    (100 - arbitrumLiquidityPercent - mainnetLiquidityPercent - stakedPercent).toFixed(2)
  );
  let mycDistributionData = [
    {
      name: "staked",
      value: stakedPercent,
      color: "#4353fa",
    },
    {
      name: "in Arbitrum liquidity",
      value: arbitrumLiquidityPercent,
      color: "#0598fa",
    },
    {
      name: "in Mainnet liquidity",
      value: mainnetLiquidityPercent,
      color: "#4353fa",
    },
    {
      name: "in wallets",
      value: notStakedPercent,
      color: "#5c0af5",
    },
  ];

  const totalStatsStartDate = "14 Aug 2022";

  let stableMlp = 0;
  let totalMlp = 0;

  let mlpPool = tokenList.map((token) => {
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo.usdgAmount && adjustedUsdgSupply && !adjustedUsdgSupply.eq(0)) {
      const currentWeightBps = tokenInfo.usdgAmount.mul(BASIS_POINTS_DIVISOR).div(adjustedUsdgSupply);
      if (tokenInfo.isStable) {
        stableMlp += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      }
      totalMlp += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      return {
        fullname: token.name,
        name: token.symbol,
        value: parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`),
      };
    }
    return null;
  });

  let stablePercentage = totalMlp > 0 ? ((stableMlp * 100) / totalMlp).toFixed(2) : "0.0";

  mlpPool = mlpPool.filter(function (element) {
    return element !== null;
  });

  mlpPool = mlpPool.sort(function (a, b) {
    if (a.value < b.value) return 1;
    else return -1;
  });

  mycDistributionData = mycDistributionData.sort(function (a, b) {
    if (a.value < b.value) return 1;
    else return -1;
  });

  const [mycActiveIndex, setMYCActiveIndex] = useState(null);

  const onMYCDistributionChartEnter = (_, index) => {
    setMYCActiveIndex(index);
  };

  const onMYCDistributionChartLeave = (_, index) => {
    setMYCActiveIndex(null);
  };

  const [mlpActiveIndex, setMLPActiveIndex] = useState(null);

  const onMLPPoolChartEnter = (_, index) => {
    setMLPActiveIndex(index);
  };

  const onMLPPoolChartLeave = (_, index) => {
    setMLPActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="stats-label">
          <div className="stats-label-color" style={{ backgroundColor: payload[0].color }}></div>
          {payload[0].value}% {payload[0].name}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <SEO
        title={getPageTitle("Dashboard")}
        description="View stats on Mycelium Perpetual Swaps, the MYC token, the MLP token and the MLP liquidity pool."
      />
      <div className="default-container DashboardV2 page-layout">
        <div className="section-title-block">
          <div className="section-title-content">
            <div className="Page-title">
              Stats{" "}
              {(chainId === ARBITRUM || chainId === ARBITRUM_GOERLI) && (
                <img src={arbitrum24Icon} alt="arbitrum24Icon" />
              )}
            </div>
            <div className="Page-description">
              {chainName} Total Stats start from {totalStatsStartDate}.<br />
              See detailed analytics{" "}
              <a href="https://analytics.mycelium.xyz" target="_blank" rel="noopener noreferrer">
                here.
              </a>
            </div>
          </div>
        </div>
        <div className="DashboardV2-content">
          <div className="DashboardV2-cards">
            <div className="App-card">
              <div className="App-card-title">Overview</div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">AUM</div>
                  <div>
                    <TooltipComponent
                      handle={`$${formatAmount(tvl, USD_DECIMALS, 0, true)}`}
                      position="right-bottom"
                      renderContent={() => `Assets Under Management: MYC staked (All chains) + MLP pool (${chainName})`}
                    />
                  </div>
                </div>

                <div className="App-card-row">
                  <div className="label">MLP Pool</div>
                  <div>
                    <TooltipComponent
                      handle={`$${formatAmount(aum, USD_DECIMALS, 0, true)}`}
                      position="right-bottom"
                      renderContent={() => `Total value of tokens in MLP pool (${chainName})`}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">24h Volume</div>
                  <div>${formatAmount(mycTotalVolume?.oneDayVolume, USD_DECIMALS, 0, true)}</div>
                </div>
                <div className="App-card-row">
                  <div className="label">Long Positions</div>
                  <div>${formatAmount(totalLongPositionSizes, USD_DECIMALS, 0, true)}</div>
                </div>
                <div className="App-card-row">
                  <div className="label">Short Positions</div>
                  <div>${formatAmount(totalShortPositionSizes, USD_DECIMALS, 0, true)}</div>
                </div>
                <div className="App-card-row">
                  <div className="label">Fees since {formatDate(currentFortnight)}</div>
                  <div>${formatAmount(totalCurrentFees, USD_DECIMALS, 2, true)}</div>
                </div>
              </div>
            </div>
            <div className="App-card">
              <div className="App-card-title">Total Stats</div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">Total Fees</div>
                  <div>${formatAmount(totalFees, USD_DECIMALS, 0, true)}</div>
                </div>
                <div className="App-card-row">
                  <div className="label">Total Volume</div>
                  <div>${formatAmount(mycTotalVolume?.totalVolume, USD_DECIMALS, 0, true)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="Tab-title-section">
            <div className="Page-title">
              Tokens {chainId === ARBITRUM && <img src={arbitrum24Icon} alt="arbitrum24Icon" />}
            </div>
            <div className="Page-description">Platform and MLP index tokens.</div>
          </div>
          <div className="DashboardV2-token-cards">
            <div className="stats-wrapper stats-wrapper--myc">
              <div className="App-card Myc">
                <div className="stats-container">
                  <div className="stats-block">
                    <div className="App-card-title">
                      <div className="App-card-title-mark">
                        <div className="App-card-title-mark-icon">
                          <img src={mycToken} alt="mycToken" />
                        </div>
                        <div className="App-card-title-mark-info">
                          <div className="App-card-title-mark-title">MYC</div>
                          <div className="App-card-title-mark-subtitle">MYC</div>
                        </div>
                        <div>
                          <AssetDropdown assetSymbol="MYC" />
                        </div>
                      </div>
                    </div>
                    <div className="App-card-divider"></div>
                    <div className="App-card-content">
                      <div className="App-card-row">
                        <div className="label">Price</div>
                        <div>
                          {!mycPrice && "..."}
                          {mycPrice && (
                            <TooltipComponent
                              position="right-bottom"
                              className="nowrap"
                              handle={`$${formatAmount(mycPrice, USD_DECIMALS, 3, true)}`}
                              renderContent={() => (
                                <>
                                  Price on Arbitrum: ${formatAmount(mycPriceFromArbitrum, USD_DECIMALS, 4, true)}
                                  <br />
                                  Price on Mainnet: ${formatAmount(mycPriceFromMainnet, USD_DECIMALS, 4, true)}
                                </>
                              )}
                            />
                          )}
                        </div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">Supply</div>
                        <div>
                          <TooltipComponent
                            position="right-bottom"
                            className="nowrap"
                            handle={`${formatAmount(circulatingMYCSupply, MYC_DECIMALS, 0, true)} MYC`}
                            renderContent={() => (
                              <>
                                Circulating: {formatAmount(circulatingMYCSupply, MYC_DECIMALS, 0, true)} MYC
                                <br />
                                Total: {formatAmount(mycSupply, MYC_DECIMALS, 0, true)} MYC
                              </>
                            )}
                          />
                        </div>
                      </div>
                      {/*<div className="App-card-row">
                      <div className="label">Total Staked</div>
                      <div>
                        {
                          <TooltipComponent
                            position="right-bottom"
                            className="nowrap"
                            handle={`$${formatAmount(stakedMycSupplyUsd, USD_DECIMALS, 0, true)}`}
                            renderContent={() => (
                              <>
                                Staked on Arbitrum: {formatAmount(arbitrumStakedMyc, MYC_DECIMALS, 0, true)} MYC
                              </>
                            )}
                          />
                        }
                      </div>
                    </div>*/}
                      <div className="App-card-row">
                        <div className="label">Market Cap</div>
                        <div>
                          <TooltipComponent
                            position="right-bottom"
                            className="nowrap"
                            handle={`$${formatAmount(mycMarketCap, USD_DECIMALS, 0, true)}`}
                            renderContent={() => (
                              <>Fully Diluted: ${formatAmount(mycFullyDilutedMarketCap, USD_DECIMALS, 0, true)}</>
                            )}
                          />
                        </div>
                      </div>
                      {stakingApr && (
                        <div className="App-card-row">
                          <div className="label">Staking APR</div>
                          <div>{stakingApr}%</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="stats-piechart" onMouseLeave={onMYCDistributionChartLeave}>
                    {mycDistributionData.length > 0 && (
                      <PieChart width={210} height={210}>
                        <Pie
                          data={mycDistributionData}
                          cx={100}
                          cy={100}
                          innerRadius={73}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={2}
                          onMouseEnter={onMYCDistributionChartEnter}
                          onMouseOut={onMYCDistributionChartLeave}
                          onMouseLeave={onMYCDistributionChartLeave}
                        >
                          {mycDistributionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              style={{
                                filter:
                                  mycActiveIndex === index
                                    ? `drop-shadow(0px 0px 6px ${hexToRgba(entry.color, 0.7)})`
                                    : "none",
                                cursor: "pointer",
                              }}
                              stroke={entry.color}
                              strokeWidth={mycActiveIndex === index ? 1 : 1}
                            />
                          ))}
                        </Pie>
                        <text x={"50%"} y={"50%"} fill="white" textAnchor="middle" dominantBaseline="middle">
                          Distribution
                        </text>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    )}
                  </div>
                </div>
                <div className="Button-container">
                  {/* <div className="Staking-btn">
                    <a href="https://stake.mycelium.xyz" target="_blank" rel="noopener noreferrer">
                      <button className="App-button-option App-card-option">MYC Staking</button>
                    </a>
                  </div>
                  <div className="Buy-btn">
                    <a
                      href="https://app.1inch.io/#/42161/unified/swap/USDC/0xc74fe4c715510ec2f8c61d70d397b32043f55abe"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="App-button-option App-card-option">Buy MYC</button>
                    </a>
                  </div> */}
                </div>
              </div>
              <div className="App-card">
                <div className="stats-block">
                  <div className="App-card-title">
                    <div className="App-card-title-mark">
                      <div className="App-card-title-mark-icon">
                        <img src={mlp40Icon} alt="mlp40Icon" />
                      </div>
                      <div className="App-card-title-mark-info">
                        <div className="App-card-title-mark-title">MLP</div>
                        <div className="App-card-title-mark-subtitle">MLP</div>
                      </div>
                      <div>
                        <AssetDropdown assetSymbol="MLP" />
                      </div>
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">Price</div>
                      <div>${formatAmount(mlpPrice, USD_DECIMALS, 3, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Supply</div>
                      <div>{formatAmount(mlpSupply, MLP_DECIMALS, 0, true)} MLP</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Total Staked</div>
                      <div>${formatAmount(mlpMarketCap, USD_DECIMALS, 0, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Market Cap</div>
                      <div>${formatAmount(mlpMarketCap, USD_DECIMALS, 0, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Stablecoin Percentage</div>
                      <div>{stablePercentage}%</div>
                    </div>
                  </div>
                </div>
                <div className="stats-piechart" onMouseOut={onMLPPoolChartLeave}>
                  {mlpPool.length > 0 && (
                    <PieChart width={210} height={210}>
                      <Pie
                        data={mlpPool}
                        cx={100}
                        cy={100}
                        innerRadius={73}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        onMouseEnter={onMLPPoolChartEnter}
                        onMouseOut={onMLPPoolChartLeave}
                        onMouseLeave={onMLPPoolChartLeave}
                        paddingAngle={2}
                      >
                        {mlpPool.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={MLP_POOL_COLORS[entry.name]}
                            style={{
                              filter:
                                mlpActiveIndex === index
                                  ? `drop-shadow(0px 0px 6px ${hexToRgba(MLP_POOL_COLORS[entry.name], 0.7)})`
                                  : "none",
                              cursor: "pointer",
                            }}
                            stroke={MLP_POOL_COLORS[entry.name]}
                            strokeWidth={mlpActiveIndex === index ? 1 : 1}
                          />
                        ))}
                      </Pie>
                      <text x={"50%"} y={"50%"} fill="white" textAnchor="middle" dominantBaseline="middle">
                        MLP Pool
                      </text>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  )}
                </div>
              </div>
            </div>
            <div className="token-table-wrapper App-card">
              <div className="App-card-title">
                MLP Index Composition {chainId === ARBITRUM && <img src={arbitrum16Icon} alt="arbitrum16Icon" />}
              </div>
              <div className="App-card-divider"></div>
              <table className="token-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Price</th>
                    <th>Pool</th>
                    <th>Weight</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenList.map((token) => {
                    const tokenInfo = infoTokens[token.address];
                    let utilization = bigNumberify(0);
                    if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
                      utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
                    }
                    let maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
                    if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                      maxUsdgAmount = tokenInfo.maxUsdgAmount;
                    }

                    var tokenImage = null;

                    try {
                      tokenImage = require("../../img/ic_" + token.symbol.toLowerCase() + "_40.svg");
                    } catch (error) {
                      console.error(error);
                    }

                    return (
                      <tr key={token.symbol}>
                        <td>
                          <div className="token-symbol-wrapper">
                            <div className="App-card-title-info">
                              <div className="App-card-title-info-icon">
                                <img src={tokenImage && tokenImage.default} alt={token.symbol} width="40px" />
                              </div>
                              <div className="App-card-title-info-text">
                                <div className="App-card-info-title">{token.name}</div>
                                <div className="App-card-info-subtitle">{token.symbol}</div>
                              </div>
                              <div>
                                <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 2, true)}</td>
                        <td>
                          <TooltipComponent
                            handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}`}
                            position="right-bottom"
                            renderContent={() => {
                              return (
                                <>
                                  Pool Amount: {formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 2, true)}{" "}
                                  {token.symbol}
                                  <br />
                                  <br />
                                  Max {tokenInfo.symbol} Capacity: ${formatAmount(maxUsdgAmount, 18, 0, true)}
                                </>
                              );
                            }}
                          />
                        </td>
                        <td>{getWeightText(tokenInfo)}</td>
                        <td>{formatAmount(utilization, 2, 2, false)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="token-grid">
              {tokenList.map((token) => {
                const tokenInfo = infoTokens[token.address];
                let utilization = bigNumberify(0);
                if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
                  utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
                }
                let maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
                if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                  maxUsdgAmount = tokenInfo.maxUsdgAmount;
                }

                return (
                  <div className="App-card" key={token.symbol}>
                    <div className="App-card-title">
                      <div style={{ display: "flex" }}>
                        {token.symbol}
                        <div>
                          <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                        </div>
                      </div>
                    </div>
                    <div className="App-card-divider"></div>
                    <div className="App-card-content">
                      <div className="App-card-row">
                        <div className="label">Price</div>
                        <div>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 2, true)}</div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">Pool</div>
                        <div>
                          <TooltipComponent
                            handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}`}
                            position="right-bottom"
                            renderContent={() => {
                              return (
                                <>
                                  Pool Amount: {formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 2, true)}{" "}
                                  {token.symbol}
                                  <br />
                                  <br />
                                  Max {tokenInfo.symbol} Capacity: ${formatAmount(maxUsdgAmount, 18, 0, true)}
                                </>
                              );
                            }}
                          />
                        </div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">Weight</div>
                        <div>{getWeightText(tokenInfo)}</div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">Utilization</div>
                        <div>{formatAmount(utilization, 2, 2, false)}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
