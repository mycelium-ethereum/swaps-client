import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import * as gtag from "./utils/gtag";
import { hasUserConsented } from "./utils/Helpers";

export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (hasUserConsented()) {
      gtag.pageview(location.href);
    }
  }, [location.href]);

  return null;
};
