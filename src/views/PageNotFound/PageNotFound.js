import { Link } from "react-router-dom";
import SEO from "../../components/Common/SEO";

import { getPageTitle } from "../../Helpers";
import PageNotFoundImg from "../../img/page-not-found.svg";
import "./PageNotFound.css";

function PageNotFound() {
  return (
    <>
      <SEO title={getPageTitle("Page not found")} />
      <div className="page-layout">
        <div className="page-not-found">
          <img src={PageNotFoundImg} alt="Page not found!" />
          <h2>Oops, page not found!</h2>
          <p className="go-back">
            <span>Return to </span>
            <Link to="/">Home</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default PageNotFound;
