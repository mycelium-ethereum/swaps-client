import React from "react";
import * as Styles from "./Referrals.styles";
import CopyIcon from "../../img/copy.svg";
import { copyReferralCode, formatAmount, USD_DECIMALS, ETH_DECIMALS, shortenAddress, getExplorerUrl, formatDate } from "../../Helpers";
import WeekDropdown from "./WeekDropdown";
import Checkbox from "../../components/Common/Checkbox";
import {getNativeToken, getToken} from "../../data/Tokens";
import Card from "../../components/Common/Card";
import Tooltip from "../../components/Tooltip/Tooltip";
import {isRecentReferralCodeNotExpired} from "./Referrals";
import {formatUnits} from "@ethersproject/units";

function EmptyMessage({ message = "", tooltipText }) {
  return (
    <div className="empty-message">
      {tooltipText ? (
        <Tooltip handle={<p>{message}</p>} position="center-bottom" renderContent={() => tooltipText} />
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}

export default function ReferralCodesTable(props) {
  const {
    active,
    chainId,
    currentView,
    connectWallet,
    latestWeek,
    setIsCreateCodeModalVisible,
    hasCreatedCode,
    referralsData,
    recentlyAddedCodes
  } = props;

  const dummyData = [
    {
      code: "helloworld13",
      totalVolume: 772.75,
      tradersReferred: 2,
      totalRebates: 0.0386,
    },
    {
      code: "ww",
      totalVolume: 0,
      tradersReferred: 0,
      totalRebates: 0,
    },
  ];

  const openCodeModal = () => {
    setIsCreateCodeModalVisible(true);
  };

  let cumulativeStats, referrerTotalStats, rebateDistributions, referrerTierInfo;
  if (referralsData) {
    ({ cumulativeStats, referrerTotalStats, rebateDistributions, referrerTierInfo } = referralsData);
  }

  const finalReferrerTotalStats = recentlyAddedCodes.filter(isRecentReferralCodeNotExpired).reduce((acc, cv) => {
    const addedCodes = referrerTotalStats?.map((c) => c.referralCode.trim());
    if (!!addedCodes && !addedCodes.includes(cv.referralCode)) {
      acc = acc.concat(cv);
    }
    return acc;
  }, referrerTotalStats);

  return (
    <div hidden={currentView === "Rebates"}>
      <Styles.ReferralData className="App-card">
        {hasCreatedCode ? (
          <>
            <Styles.TitleContainer>
              <Styles.AppCardTitle>Referral codes</Styles.AppCardTitle>
              <Styles.CreateButton onClick={openCodeModal}>&#43;&nbsp;Create</Styles.CreateButton>
            </Styles.TitleContainer>
            <Styles.TableContainer>
              <Styles.CodesTable>
                <thead>
                  <tr>
                    <Styles.TableHeading leftAlign>Referral Code</Styles.TableHeading>
                    <Styles.TableHeading>Total Volume</Styles.TableHeading>
                    <Styles.TableHeading>Traders Referred</Styles.TableHeading>
                    <Styles.TableHeading>Referred Trades</Styles.TableHeading>
                    <Styles.TableHeading>Total Rebates</Styles.TableHeading>
                  </tr>
                </thead>
                <tbody>
                  {finalReferrerTotalStats?.map((stat) => {
                    console.log(stat)
                    return (
                      <tr key={stat.referralCode}>
                        <Styles.TableCell leftAlign>
                          <div>
                            {stat.referralCode}
                            <Styles.CopyButton onClick={() => copyReferralCode(stat.referralCode)}>
                              <img src={CopyIcon} alt="Copy" />{" "}
                            </Styles.CopyButton>
                          </div>
                        </Styles.TableCell>
                        <Styles.TableCell>${formatAmount(stat.volume, USD_DECIMALS, 2, true, '0.00')}</Styles.TableCell>
                        <Styles.TableCell>{stat.registeredReferralsCount}</Styles.TableCell>
                        <Styles.TableCell>{stat.trades}</Styles.TableCell>
                        <Styles.TableCell>${formatAmount(stat.totalRebateUsd, USD_DECIMALS, 2, true, "0.00")}</Styles.TableCell>
                      </tr>
                    )})}
                </tbody>
              </Styles.CodesTable>
            </Styles.TableContainer>
          </>
        ) : (
          <Styles.InputCodeText>
            <Styles.AppCardTitle>Generate Referral Code</Styles.AppCardTitle>
            <p>No referral codes found. Click the button below to create one now and start earning trading rebates.</p>
            {!active ? (
              <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
                Connect Wallet
              </Styles.ReferralButton>
            ) : (
              <Styles.ReferralButton className="App-cta large" onClick={() => setIsCreateCodeModalVisible(true)}>
                Create Code
              </Styles.ReferralButton>
            )}
          </Styles.InputCodeText>
        )}
      </Styles.ReferralData>
    </div>
  );
}
