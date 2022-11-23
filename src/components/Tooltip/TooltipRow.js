import * as Styled from './Tooltip.styles';

export default function TooltipRow({ label, value, showDollar = true }) {
  const valueIsArray = Array.isArray(value);

  return (
    <Styled.TooltipRow>
      <span className="label">{label}:</span>
      {valueIsArray ?
        <Styled.TooltipRowValues>
          {value.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </Styled.TooltipRowValues>
        : <Styled.TooltipRowValue>
          {showDollar && "$"}
          {value}
        </Styled.TooltipRowValue>
      }
    </Styled.TooltipRow>
  );
}
