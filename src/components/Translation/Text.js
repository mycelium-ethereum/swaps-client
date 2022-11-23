import { Translate } from "react-auto-translate";

// Requires Translator context
export const Text = ({ children }) => {
  if (!children) return <></>;
  return <Translate>{children}</Translate>;
};
