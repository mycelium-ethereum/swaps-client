import React from "react";
import cx from "classnames";
import * as Styles from "./Referrals.styles";

export function ReferralsSwitch(props) {
  const { switchView, currentView, trackAction } = props;

  return (
    <Styles.ViewSwitchContainer>
      <Styles.ViewSwitch
        onClick={() => {
          switchView();
          trackAction &&
            trackAction("Button clicked", {
              buttonName: "Rewards panel",
              view: currentView === "Commissions" ? "Rebates" : "Commissions",
            });
        }}
      >
        <Styles.SwitchBackdrop
          className={cx({
            "commissions-selected": currentView === "Commissions",
          })}
        />
        <Styles.ViewOption
          className={cx({
            selected: currentView === "Rebates",
          })}
        >
          Rebates
        </Styles.ViewOption>
        <Styles.ViewOption
          className={cx({
            selected: currentView === "Commissions",
          })}
        >
          Commissions
        </Styles.ViewOption>
      </Styles.ViewSwitch>
    </Styles.ViewSwitchContainer>
  );
}
