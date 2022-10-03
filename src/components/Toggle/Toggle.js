import {InnerBubble, StyledToggle} from "./Toggle.styles";


const Toggle = ({ isChecked, handleToggle, disabled }) => {

  return (
    <StyledToggle checked={isChecked} disabled={disabled} onClick={() => !disabled && handleToggle(!isChecked)} className="Toggle">
      <InnerBubble className="Toggle-inner-bubble" />
    </StyledToggle>
  )

}

export default Toggle;
