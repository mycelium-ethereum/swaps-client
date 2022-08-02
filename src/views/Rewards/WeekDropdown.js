import React from "react";
import { Menu } from "@headlessui/react";
import * as Styles from "./Rewards.styles";
import { FaChevronDown } from "react-icons/fa";

export default function WeekDropdown(props) {
  const { rewardWeeks, setSelectedWeek, rewardsMessage } = props;

  return (
    <Styles.RewardsWeekSelectMenu>
      <Menu>
        <Menu.Button as="div">
          <Styles.WeekSelectButton className="App-cta transparent">
            {rewardsMessage}
            <FaChevronDown />
          </Styles.WeekSelectButton>
        </Menu.Button>
        <div className="hide-overflow">
          <Menu.Items as="div" className="menu-items">
            {rewardWeeks.map((rewardWeek) => (
              <Menu.Item>
                <div className="menu-item" onClick={() => setSelectedWeek(parseFloat(rewardWeek.week) + 1)}>
                  Week {parseFloat(rewardWeek.week) + 1}
                </div>
              </Menu.Item>
            ))}
          </Menu.Items>
        </div>
      </Menu>
    </Styles.RewardsWeekSelectMenu>
  );
}
