import * as Styled from './TooltipRow.styles';

export default function TooltipRow({ label, value, showDollar = true }) {
  function renderValue() {
    if (Array.isArray(value)) {
      return (
        <Styled.TooltipRowValues className="Tooltip-row-values">
          {value.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </Styled.TooltipRowValues>
      );
    }
    return (
      <Styled.TooltipRowValue className="Tooltip-row-value">
        {showDollar && "$"}
        {value}
      </Styled.TooltipRowValue>
    );
  }
  return (
    <Styled.TooltipRow className="Tooltip-row">
      <span className="label">{label}:</span>
      {renderValue()}
    </Styled.TooltipRow>
  );
}
