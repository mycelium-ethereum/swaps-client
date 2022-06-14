import { useEffect } from "react";

export default function SellTlp(props) {
  useEffect(() => {
    window.location.href = "/buy_tlp#redeem";
  }, []);
  return <div className="Page page-layout"></div>;
}
