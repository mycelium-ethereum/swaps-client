import React from "react";
import { Menu } from "@headlessui/react";
import * as Styles from "./RewardsRoundSelect.styles";
import { FaChevronDown } from "react-icons/fa";
import cx from "classnames";

export default function RewardsRoundSelect({
  timeTillRewards,
  allRoundsRewardsData,
  setSelectedRound,
  trackAction,
  rewardsMessage,
}) {
  return (
    <Styles.RewardsRoundSelect>
      {!!allRoundsRewardsData && (
        <RoundDropdown
          allRoundsRewardsData={allRoundsRewardsData}
          setSelectedRound={setSelectedRound}
          rewardsMessage={rewardsMessage}
          trackAction={trackAction}
        />
      )}
      {timeTillRewards && (
        <Styles.RewardsRoundNextRewards>
          Next rewards in <Styles.RewardsRoundCountdown>{timeTillRewards}</Styles.RewardsRoundCountdown>
        </Styles.RewardsRoundNextRewards>
      )}
    </Styles.RewardsRoundSelect>
  );
}

export function RoundDropdown(props) {
  const { allRoundsRewardsData, setSelectedRound, rewardsMessage, trackAction } = props;

  return (
    <Styles.RewardsRoundSelectMenu>
      <Menu>
        {({ open }) => (
          <>
            <Menu.Button as="div">
              <Styles.RoundSelectButton
                className={cx("App-cta transparent", {
                  "App-cta-selected": open,
                })}
                onClick={() =>
                  trackAction &&
                  trackAction("Button clicked", {
                    buttonName: "Rewards round dropdown",
                  })
                }
              >
                {rewardsMessage}
                <FaChevronDown />
              </Styles.RoundSelectButton>
            </Menu.Button>
            <div className="hide-overflow">
              <Menu.Items as="div" className="menu-items">
                {allRoundsRewardsData &&
                  allRoundsRewardsData
                    .sort((a, b) => b.round - a.round)
                    .map((rewardRound, index) => (
                      <Menu.Item>
                        <div
                          className="menu-item large"
                          onClick={() => {
                            let selectedRound = parseFloat(rewardRound?.round);
                            if (index === 0) {
                              selectedRound = "latest";
                            }
                            setSelectedRound(selectedRound);
                            trackAction &&
                              trackAction("Button clicked", {
                                buttonName: "Select rewards round",
                                weekNo: selectedRound,
                              });
                          }}
                        >
                          {rewardRound?.customRoundText
                            ? rewardRound.customRoundText
                            : `Round ${parseFloat(rewardRound?.round) + 1}`}
                        </div>
                      </Menu.Item>
                    ))}
              </Menu.Items>
            </div>
          </>
        )}
      </Menu>
    </Styles.RewardsRoundSelectMenu>
  );
}
