import React from "react";
import * as Styles from "./Rewards.styles";
import cx from "classnames";
import { Menu } from "@headlessui/react";
import { FaChevronDown } from "react-icons/fa";

export function LeaderboardSwitch(props) {
  const { switchView, currentView, rewardsMessage, rewardWeeks, setSelectedWeek } = props;

  return (
    <Styles.ViewSwitchContainer>
      <Styles.ViewSwitch onClick={switchView}>
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
      {currentView === "Leaderboard" ? (
        <Menu>
          <Menu.Button as="div">
            <Styles.WeekSelectButton className="App-cta transparent">
              {rewardsMessage}
              <FaChevronDown />
            </Styles.WeekSelectButton>
          </Menu.Button>
          {!!rewardWeeks ? (
            <div>
              <Menu.Items as="div" className="menu-items">
                {rewardWeeks.map((rewardWeek) => (
                  <Menu.Item>
                    <div className="menu-item" onClick={() => setSelectedWeek(rewardWeek.week)}>
                      Week {rewardWeek.week}
                    </div>
                  </Menu.Item>
                ))}
              </Menu.Items>
            </div>
          ) : null}
        </Menu>
      ) : null}
    </Styles.ViewSwitchContainer>
  );
}
