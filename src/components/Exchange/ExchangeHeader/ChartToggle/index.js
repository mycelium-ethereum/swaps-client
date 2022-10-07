import cx from "classnames";
import { SwitchContainer, ToggleSwitch, SwitchThumb, SwitchText } from "./ChartToggle.styles.js";

export const ChartToggle = (props) => {
  const { selectedChart, setSelectedChart } = props;

  const handleSwitch = () => {
    setSelectedChart(selectedChart === "lightweight" ? "advanced" : "lightweight");
  };

  return (
    <SwitchContainer>
      <ToggleSwitch
        onClick={handleSwitch}
        className={cx({
          selected: selectedChart === "advanced",
        })}
      >
        <SwitchThumb
          className={cx({
            selected: selectedChart === "advanced",
          })}
        />
      </ToggleSwitch>
      <SwitchText
        className={cx({
          selected: selectedChart === "advanced",
        })}
      >
        Trading View
      </SwitchText>
    </SwitchContainer>
  );
};
