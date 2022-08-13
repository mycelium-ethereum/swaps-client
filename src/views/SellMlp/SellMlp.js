import { useEffect } from "react";

export default function SellMlp(props) {
  useEffect(() => {
    window.location.href = "/buy_mlp#redeem";
  }, []);
  return <div className="Page page-layout"></div>;
}
