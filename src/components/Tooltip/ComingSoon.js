import Tooltip from "./Tooltip";

export const ComingSoonTooltip = ({ handle }) => <Tooltip
  className="Tooltip-coming-soon"
  handle={handle}
  renderContent={() => `Coming Soon`}
/>

export default ComingSoonTooltip;
