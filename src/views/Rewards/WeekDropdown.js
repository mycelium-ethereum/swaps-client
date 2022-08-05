import React from "react";
import { Menu } from "@headlessui/react";
import * as Styles from "./Rewards.styles";
import { FaChevronDown } from "react-icons/fa";
import cx from "classnames";

export default function WeekDropdown(props) {
  const { weeksRewardsData, setSelectedWeek, rewardsMessage } = props;

  return (
    <Styles.RewardsWeekSelectMenu>
      <Menu>
        {({ open }) => (
          <>
            <Menu.Button as="div">
              <Styles.WeekSelectButton
                className={cx("App-cta transparent", {
                  "App-cta-selected": open,
                })}
              >
                {rewardsMessage}
                <FaChevronDown />
              </Styles.WeekSelectButton>
            </Menu.Button>
            <div className="hide-overflow">
              <Menu.Items as="div" className="menu-items">
                {weeksRewardsData
                  .sort((a, b) => b.week - a.week)
                  .map((rewardWeek) => (
                    <Menu.Item>
                      <div className="menu-item large" onClick={() => setSelectedWeek(parseFloat(rewardWeek.week) + 1)}>
                        Week {parseFloat(rewardWeek.week) + 1}
                      </div>
                    </Menu.Item>
                  ))}
              </Menu.Items>
            </div>
          </>
        )}
      </Menu>
    </Styles.RewardsWeekSelectMenu>
  );
}
