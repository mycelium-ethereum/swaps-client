import React from "react";

import "./Spinner.css";

export default function Spinner(props) {
  const { size, strokeWidth } = props;
  // console.log("size", size);
  // console.log("strokeWidth", strokeWidth);

  return (
    <svg
      className="Spinner"
      width={`${size - 1}px`}
      height={`${size - 1}px`}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="Spinner-path"
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        cx={size / 2}
        cy={size / 2}
        r={(size - strokeWidth) / 2}
      ></circle>
    </svg>
  );
}
