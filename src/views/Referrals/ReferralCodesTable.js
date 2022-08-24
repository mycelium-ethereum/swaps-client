import React from "react";
import * as Styles from "./Referrals.styles";
import CopyIcon from "../../img/copy.svg";
import { copyReferralCode, formatAmount, USD_DECIMALS, ETH_DECIMALS } from "../../Helpers";
import WeekDropdown from "./WeekDropdown";
import Checkbox from "../../components/Common/Checkbox";

export function TableRow(props) {
  const { code, totalVolume, tradersReferred, totalRebates } = props;

  return (
    <tr>
      <Styles.TableCell leftAlign>
        <div>
          {code}
          <Styles.CopyButton onClick={() => copyReferralCode(code)}>
            <img src={CopyIcon} alt="Copy" />{" "}
          </Styles.CopyButton>
        </div>
      </Styles.TableCell>
      <Styles.TableCell>${totalVolume.toFixed(2)}</Styles.TableCell>
      <Styles.TableCell>{tradersReferred}</Styles.TableCell>
      <Styles.TableCell>{totalRebates.toFixed(4)} ETH</Styles.TableCell>
      <Styles.TableCell>
        <Checkbox isChecked={true} handleClick={() => {}} />
      </Styles.TableCell>
    </tr>
  );
}

export default function ReferralCodesTable(props) {
  const {
    active,
    currentView,
    trackAction,
    allWeeksReferralData,
    setSelectedWeek,
    referralMessage,
    nextRewards,
    timeTillRewards,
    connectWallet,
    userWeekData,
    latestWeek,
    setIsCreateCodeModalVisible,
    hasCreatedCode,
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
                    <Styles.TableHeading>Total Rebates</Styles.TableHeading>
                    <Styles.TableHeading>Active</Styles.TableHeading>
                  </tr>
                </thead>
                <tbody>
                  {dummyData.map((row) => (
                    <TableRow key={row.code} {...row} />
                  ))}
                </tbody>
              </Styles.CodesTable>
            </Styles.TableContainer>
          </>
        ) : (
          <Styles.InputCodeText>
            <Styles.AppCardTitle>Generate Referral Code</Styles.AppCardTitle>
            <p>No referral codes found. Click the button below to create one now and start earning trading rebates.</p>
            <Styles.ReferralButton className="App-cta large" onClick={() => setIsCreateCodeModalVisible(true)}>
              Create Code
            </Styles.ReferralButton>
          </Styles.InputCodeText>
        )}
      </Styles.ReferralData>
      {hasCreatedCode && (
        <Styles.ReferralData className="App-card">
          <Styles.AppCardTitle>Weekly data</Styles.AppCardTitle>
          <Styles.ReferralWeekSelect>
            {!!allWeeksReferralData ? (
              <WeekDropdown
                allWeeksReferralData={allWeeksReferralData}
                setSelectedWeek={setSelectedWeek}
                referralMessage={referralMessage}
                trackAction={trackAction}
              />
            ) : null}
            {nextRewards && timeTillRewards && (
              <Styles.ReferralWeekNextReferral>
                Next Rewards in <Styles.ReferralWeekCountdown>{timeTillRewards}</Styles.ReferralWeekCountdown>
              </Styles.ReferralWeekNextReferral>
            )}
          </Styles.ReferralWeekSelect>
          <Styles.ReferralDataBoxes>
            <Styles.ReferralDataBox>
              <Styles.ReferralDataBoxTitle>Volume Traded</Styles.ReferralDataBoxTitle>
              <Styles.LargeText> {`$${formatAmount(userWeekData?.volume, USD_DECIMALS, 2, true)}`}</Styles.LargeText>
            </Styles.ReferralDataBox>
            <Styles.ReferralDataBox className="claimable">
              <Styles.ReferralDataBoxTitle>Claimable Commissions</Styles.ReferralDataBoxTitle>
              <div>
                <Styles.LargeText>{`${formatAmount(
                  userWeekData?.reward,
                  ETH_DECIMALS,
                  4,
                  true
                )} ETH`}</Styles.LargeText>
                <span>
                  {" "}
                  {` ($${formatAmount(userWeekData?.rewardAmountUsd, ETH_DECIMALS + USD_DECIMALS, 2, true)})`}
                </span>
              </div>
            </Styles.ReferralDataBox>
          </Styles.ReferralDataBoxes>
          {active && latestWeek && (
            <Styles.ReferralButton disabled className="App-cta large">
              Week ends in {timeTillRewards}
            </Styles.ReferralButton>
          )}
          {active && !latestWeek && (
            <Styles.ReferralButton className="App-cta large"> Claim Rebates </Styles.ReferralButton>
          )}
          {!active && (
            <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
              Connect Wallet
            </Styles.ReferralButton>
          )}
        </Styles.ReferralData>
      )}
    </div>
  );
}
