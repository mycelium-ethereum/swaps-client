import React from "react";
import * as Styles from "./Rewards.styles";
import cx from "classnames";
import WeekDropdown from "./WeekDropdown";

export function LeaderboardSwitch(props) {
  const { switchView, currentView, rewardsMessage, rewardWeeks, setSelectedWeek, trackAction } = props;

  return (
    <Styles.ViewSwitchContainer>
      <Styles.ViewSwitch
        onClick={() => {
          switchView();
          trackAction &&
            trackAction("Button clicked", {
              buttonName: "Rewards panel",
              view: currentView === "Leaderboard" ? "Rewards" : "Leaderboard",
            });
        }}
      >
        <Styles.SwitchBackdrop
          className={cx({
            "leaderboard-selected": currentView === "Leaderboard",
          })}
        />
        <Styles.ViewOption
          className={cx({
            selected: currentView === "Personal",
          })}
        >
          Personal
        </Styles.ViewOption>
        <Styles.ViewOption
          className={cx({
            selected: currentView === "Leaderboard",
          })}
        >
          Leaderboard
        </Styles.ViewOption>
      </Styles.ViewSwitch>
      {currentView === "Leaderboard" && !!rewardWeeks ? (
        <WeekDropdown rewardWeeks={rewardWeeks} setSelectedWeek={setSelectedWeek} rewardsMessage={rewardsMessage} />
      ) : null}
    </Styles.ViewSwitchContainer>
  );
}
