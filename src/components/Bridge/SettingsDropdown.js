import React from "react";
import cx from "classnames";
import { Menu } from "@headlessui/react";
import { FaChevronDown } from "react-icons/fa";
import * as Styles from "./SettingsDropdown.styles";

export function SettingsDropdown(props) {
  const { settingsContent, selectedSetting, setSelectedSetting } = props;

  return (
    <Styles.StyledSettingsDropdown>
      <Menu>
        {({ open }) => (
          <>
            <Menu.Button as="div">
              <Styles.SettingSelectButton
                className={cx("App-cta transparent", {
                  "App-cta-selected": open,
                })}
              >
                {selectedSetting}
                <FaChevronDown />
              </Styles.SettingSelectButton>
            </Menu.Button>
            <div className="hide-overflow">
              <Menu.Items as="div" className="menu-items">
                {settingsContent.map(({ label, func }) => (
                  <Menu.Item key={label}>
                    <div
                      className="menu-item large"
                      onClick={() => {
                        setSelectedSetting(label);
                        func();
                      }}
                    >
                      {label}
                    </div>
                  </Menu.Item>
                ))}
              </Menu.Items>
            </div>
          </>
        )}
      </Menu>
    </Styles.StyledSettingsDropdown>
  );
}
