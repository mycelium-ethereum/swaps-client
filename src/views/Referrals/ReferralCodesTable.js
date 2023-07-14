import { formatAmount, USD_DECIMALS } from "../../Helpers";
import CopyIcon from "../../img/copy.svg";
import { copyReferralCode } from "../../utils/referrals";
import * as Styles from "./Referrals.styles";

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
                      <Styles.TableHeading>Total Commission</Styles.TableHeading>
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
            <>
              {/* <Styles.InputCodeText>
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
          </Styles.InputCodeText> */}
            </>
          )}
        </Styles.ReferralData>
      )}
    </div>
  );
}
