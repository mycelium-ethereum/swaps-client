import React from "react";
import * as Styles from "./Referrals.styles";
import CopyIcon from "../../img/copy.svg";
import { copyReferralCode, formatAmount, USD_DECIMALS } from "../../Helpers";
import { Text } from "../../components/Translation/Text";

export default function ReferralCodesTable(props) {
  const { active, connectWallet, setIsCreateCodeModalVisible, finalReferrerTotalStats } = props;

  const openCodeModal = () => {
    setIsCreateCodeModalVisible(true);
  };

  return (
    <div>
      {!!finalReferrerTotalStats && (
        <Styles.ReferralData className="App-card">
          {finalReferrerTotalStats?.length ? (
            <>
              <Styles.TitleContainer>
                <Styles.AppCardTitle>
                  <Text>Referral codes</Text>
                </Styles.AppCardTitle>
                <Styles.CreateButton onClick={openCodeModal}>
                  &#43;&nbsp;<Text>Create</Text>
                </Styles.CreateButton>
              </Styles.TitleContainer>
              <Styles.TableContainer>
                <Styles.CodesTable>
                  <thead>
                    <tr>
                      <Styles.TableHeading leftAlign>
                        <Text>Referral Code</Text>
                      </Styles.TableHeading>
                      <Styles.TableHeading>
                        <Text>Total Volume</Text>
                      </Styles.TableHeading>
                      <Styles.TableHeading>
                        <Text>Traders Referred</Text>
                      </Styles.TableHeading>
                      <Styles.TableHeading>
                        <Text>Referred Trades</Text>
                      </Styles.TableHeading>
                      <Styles.TableHeading>
                        <Text>Total Commission</Text>
                      </Styles.TableHeading>
                    </tr>
                  </thead>
                  <tbody>
                    {finalReferrerTotalStats?.map((stat) => {
                      const commission = stat.totalRebateUsd.sub(stat.discountUsd);
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
                          <Styles.TableCell>
                            ${formatAmount(stat.volume, USD_DECIMALS, 2, true, "0.00")}
                          </Styles.TableCell>
                          <Styles.TableCell>{stat.registeredReferralsCount}</Styles.TableCell>
                          <Styles.TableCell>{stat.trades}</Styles.TableCell>
                          <Styles.TableCell>
                            ${formatAmount(commission, USD_DECIMALS, 3, true, "0.00")}
                          </Styles.TableCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </Styles.CodesTable>
              </Styles.TableContainer>
            </>
          ) : (
            <Styles.InputCodeText>
              <Styles.AppCardTitle>
                <Text>Generate Referral Code</Text>
              </Styles.AppCardTitle>
              <p>
                <Text>
                  No referral codes found. Click the button below to create one now and start earning trading rebates.
                </Text>
              </p>
              {!active ? (
                <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
                  <Text>Connect Wallet</Text>
                </Styles.ReferralButton>
              ) : (
                <Styles.ReferralButton className="App-cta large" onClick={() => setIsCreateCodeModalVisible(true)}>
                  <Text>Create Code</Text>
                </Styles.ReferralButton>
              )}
            </Styles.InputCodeText>
          )}
        </Styles.ReferralData>
      )}
    </div>
  );
}
