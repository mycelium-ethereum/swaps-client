import Tooltip from "./Tooltip";

export const ComingSoonTooltip = ({ handle, position }) => <Tooltip
  className="Tooltip-coming-soon"
  position={position}
  handle={handle}
  renderContent={() => `Coming Soon`}
/>

export default ComingSoonTooltip;
