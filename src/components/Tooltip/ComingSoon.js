import Tooltip from "./Tooltip";

export const ComingSoonTooltip = ({ handle }) => <Tooltip
  handle={handle}
  // position="center-bottom"
  renderContent={() => `Coming Soon`}
/>

export default ComingSoonTooltip;
