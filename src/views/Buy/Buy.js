import React, { useEffect } from "react";
import Footer from "../../Footer";
import "./Buy.css";
import TokenCard from "../../components/TokenCard/TokenCard";
import buyMYCIcon from "../../img/buy_gmx.svg";
import SEO from "../../components/Common/SEO";
import { getPageTitle } from "../../Helpers";

export default function BuyMYCMLP(props) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <SEO title={getPageTitle("Buy MLP or MYC")}>
      <div className="BuyMYCMLP page-layout">
        <div className="BuyMYCMLP-container default-container">
          <div className="section-title-block">
            <div className="section-title-icon">
              <img src={buyMYCIcon} alt="buyMYCIcon" />
            </div>
            <div className="section-title-content">
              <div className="Page-title">Buy MLP</div>
            </div>
          </div>
          <TokenCard />
        </div>
        <Footer />
      </div>
    </SEO>
  );
}
