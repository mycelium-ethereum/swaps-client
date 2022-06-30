import { useEffect } from "react"

export const usePageSpecAnalytics = () => {
  useEffect(() => {
    if (window?.analytics?.page) {
      window.analytics.page();
    } else {
      console.error("Tried to record page but analytics.page is undefined");
    }
  }, [])
}
