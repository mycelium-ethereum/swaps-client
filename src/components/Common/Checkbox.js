import React from "react";
import * as Styles from "./Checkbox.styles";

export default function Checkbox({ isChecked, handleClick }) {
  return (
    <Styles.CheckboxContainer>
      <input type="checkbox" checked={isChecked} onChange={handleClick} readOnly />
      <Styles.CheckboxDot />
    </Styles.CheckboxContainer>
  );
}
