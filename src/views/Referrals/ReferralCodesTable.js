import React, { useState } from "react";
import ReferralCodeModal from "./ReferralCodeModal";
import * as Styles from "./Referrals.styles";
import CopyIcon from "../../img/copy.svg";
import { copyReferralCode } from "../../Helpers";

export function TableRow(props) {
  const { code, totalVolume, tradersReferred, totalRebates } = props;

  return (
    <tr>
      <Styles.TableCell leftAlign>
        {code}
        <Styles.CopyButton onClick={() => copyReferralCode(code)}>
          <img src={CopyIcon} alt="Copy" />{" "}
        </Styles.CopyButton>
      </Styles.TableCell>
      <Styles.TableCell>{totalVolume.toFixed(2)}</Styles.TableCell>
      <Styles.TableCell>{tradersReferred}</Styles.TableCell>
      <Styles.TableCell>{totalRebates.toFixed(4)}</Styles.TableCell>
    </tr>
  );
}

export default function ReferralCodesTable(props) {
  const { active, currentView, trackAction } = props;
  const [isCodeModalVisible, setIsCodeModalVisible] = useState(false);

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
    setIsCodeModalVisible(true);
  };

  return (
    <>
      <ReferralCodeModal isCodeModalVisible={isCodeModalVisible} setIsCodeModalVisible={setIsCodeModalVisible} />
      <Styles.ReferralData className="App-card" hidden={currentView === "Rebates"}>
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
              </tr>
            </thead>
            <tbody>
              {dummyData.map((row) => (
                <TableRow key={row.code} {...row} />
              ))}
            </tbody>
          </Styles.CodesTable>
        </Styles.TableContainer>
      </Styles.ReferralData>
    </>
  );
}
