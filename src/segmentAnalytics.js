import {useEffect} from "react"

export const usePageSpecAnalytics = () => {
  useEffect(() => {
    window?.analytics?.page();
  }, [])
}
