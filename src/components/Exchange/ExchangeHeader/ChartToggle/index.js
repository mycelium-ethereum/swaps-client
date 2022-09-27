import { ToggleSwitch, SwitchThumb } from "./ChartToggle.styles.js";

export const ChartToggle = (props) => {
  const { selectedChart, setSelectedChart } = props;

  const handleSwitch = () => {
    setSelectedChart(selectedChart === "lightweight" ? "advanced" : "lightweight");
  };

  return (
    <ToggleSwitch onClick={handleSwitch}>
      <SwitchThumb selectedChart={selectedChart} />
    </ToggleSwitch>
  );
};
