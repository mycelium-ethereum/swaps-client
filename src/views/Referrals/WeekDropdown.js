import React from "react";
import { Menu } from "@headlessui/react";
import * as Styles from "./Referrals.styles";
import { FaChevronDown } from "react-icons/fa";
import cx from "classnames";

export default function WeekDropdown(props) {
  const { allWeeksReferralData, setSelectedWeek, referralMessage, trackAction } = props;

  return (
    <Styles.ReferralWeekSelectMenu>
      <Menu>
        {({ open }) => (
          <>
            <Menu.Button as="div">
              <Styles.WeekSelectButton
                className={cx("App-cta transparent", {
                  "App-cta-selected": open,
                })}
                onClick={() =>
                  trackAction &&
                  trackAction("Button clicked", {
                    buttonName: "Referral week dropdown",
                  })
                }
              >
                {referralMessage}
                <FaChevronDown />
              </Styles.WeekSelectButton>
            </Menu.Button>
            <div className="hide-overflow">
              <Menu.Items as="div" className="menu-items">
                {allWeeksReferralData
                  .sort((a, b) => b.week - a.week)
                  .map((rewardWeek, index) => (
                    <Menu.Item>
                      <div
                        className="menu-item large"
                        onClick={() => {
                          let selectedWeek = parseFloat(rewardWeek.week);
                          if (index === 0) {
                            selectedWeek = "latest";
                          }
                          setSelectedWeek(selectedWeek);
                          trackAction &&
                            trackAction("Button clicked", {
                              buttonName: "Select referral week",
                              weekNo: selectedWeek,
                            });
                        }}
                      >
                        Week {parseFloat(rewardWeek.week) + 1}
                      </div>
                    </Menu.Item>
                  ))}
              </Menu.Items>
            </div>
          </>
        )}
      </Menu>
    </Styles.ReferralWeekSelectMenu>
  );
}
