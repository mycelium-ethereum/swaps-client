import React from "react";
import cx from "classnames";
import * as Styles from "./ViewSwitchTriple.styles";
import { Text } from "../Translation/Text";

export default function ViewSwitchTriple(props) {
  const { switchView, currentView, views, children } = props;

  return (
    <Styles.ViewSwitchContainer>
      <Styles.ViewSwitch>
        {views.map((view) => (
          <Styles.ViewOption
            className={cx({
              selected: currentView === view,
            })}
            onClick={() => {
              switchView(view);
            }}
          >
            <Text>{view}</Text>
          </Styles.ViewOption>
        ))}
      </Styles.ViewSwitch>
      {children}
    </Styles.ViewSwitchContainer>
  );
}
