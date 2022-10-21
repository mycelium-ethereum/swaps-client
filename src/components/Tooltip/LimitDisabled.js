import Tooltip from "./Tooltip";

export const LimitDisabledTooltip = ({ handle, position }) => (
  <Tooltip
    className="Tooltip-coming-soon"
    position={position}
    handle={handle}
    renderContent={() => `We have temporarily disabled limit orders`}
  />
);

export default LimitDisabledTooltip;
