import React from "react";
import cx from "classnames";
import * as Styles from "./ViewSwitch.styles";

export default function ViewSwitch(props) {
  const {
    switchView,
    currentView,
    views,
    children
  } = props;

  return (
    <Styles.ViewSwitchContainer>
      <Styles.ViewSwitch
        onClick={() => {
          switchView();
        }}
      >
        <Styles.SwitchBackdrop
          className={cx({
            "right-selected": currentView === views[1],
          })}
        />
        {views.map((view) => (
          <Styles.ViewOption
            className={cx({
              selected: currentView === view,
            })}
          >
            {view}
          </Styles.ViewOption>
        ))}
      </Styles.ViewSwitch>
      {children}
    </Styles.ViewSwitchContainer>
  );
}
