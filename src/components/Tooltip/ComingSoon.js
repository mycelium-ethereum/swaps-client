import Tooltip from "./Tooltip";
import { Text } from "../Translation/Text";

export const ComingSoonTooltip = ({ handle, position }) => (
  <Tooltip
    className="Tooltip-coming-soon"
    position={position}
    handle={handle}
    renderContent={() => <Text>Coming Soon</Text>}
  />
);

export default ComingSoonTooltip;
