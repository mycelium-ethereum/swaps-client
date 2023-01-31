import { BigNumber } from "ethers";
import * as React from "react";
import { formatAmount, limitDecimals, USD_DECIMALS } from "src/Helpers";
import styled from "styled-components";
import { MdEdit } from "react-icons/md";
import { IoClose } from "react-icons/io5";

interface TriggerCreatorProps {
  isLong: boolean;
  currentPrice: BigNumber;
  leverage: number;
  stopLossTriggerPercent: number | null;
  setStopLossTriggerPercent: (stopLossTrigger: number | null) => void;
  takeProfitTriggerPercent: number | null;
  setTakeProfitTriggerPercent: (takeProfitTrigger: number | null) => void;
}

const STOP_LOSS_OPTIONS = [0.1, 0.25, 0.5, 0.75];
const TAKE_PROFIT_OPTIONS = [0.1, 0.5, 1, 3];
const PERCENT_PRECISION = 10000;

export const TriggerCreator: React.FC<TriggerCreatorProps> = ({
  isLong,
  leverage,
  currentPrice,
  stopLossTriggerPercent,
  setStopLossTriggerPercent,
  takeProfitTriggerPercent,
  setTakeProfitTriggerPercent,
}) => {
  const [showCustomSLInput, setShowCustomSLInput] = React.useState(false);
  React.useEffect(() => {
    setShowCustomSLInput(false);
  }, [stopLossTriggerPercent]);

  const [showCustomTPInput, setShowCustomTPInput] = React.useState(false);
  React.useEffect(() => {
    setShowCustomTPInput(false);
  }, [takeProfitTriggerPercent]);

  const stopLossPrice = stopLossTriggerPercent
    ? calculateTriggerPrice(stopLossTriggerPercent, currentPrice, leverage, true, isLong)
    : null;

  const takeProfitPrice = takeProfitTriggerPercent
    ? calculateTriggerPrice(takeProfitTriggerPercent, currentPrice, leverage, false, isLong)
    : null;

  function calculateTriggerPrice(
    pnlPercent: number,
    currentPrice: BigNumber,
    leverage: number,
    isStopLoss: boolean,
    isLong: boolean
  ) {
    const priceMovePrecision = Math.round((pnlPercent * PERCENT_PRECISION) / leverage);
    if (isLong ? isStopLoss : !isStopLoss) {
      return currentPrice.mul(PERCENT_PRECISION - priceMovePrecision).div(PERCENT_PRECISION);
    } else {
      return currentPrice.mul(PERCENT_PRECISION + priceMovePrecision).div(PERCENT_PRECISION);
    }
  }

  const showRemoveButton = stopLossTriggerPercent || takeProfitTriggerPercent;

  return (
    <Container>
      <Header>
        Conditional
        {showRemoveButton && (
          <button
            onClick={() => {
              setStopLossTriggerPercent(null);
              setTakeProfitTriggerPercent(null);
            }}
          >
            <IoClose size={20} />
            Remove Triggers
          </button>
        )}
      </Header>
      <TriggerBox className={stopLossTriggerPercent ? "selected" : ""}>
        <h3>Stop Loss</h3>
        <TriggerBoxPrice>
          <div>{stopLossPrice ? formatAmount(stopLossPrice, USD_DECIMALS, 2, true) : "—"}</div>
          <div>USD</div>
        </TriggerBoxPrice>
        <TriggerBoxPercent>
          <div>
            {STOP_LOSS_OPTIONS.map((percent) => (
              <button
                className={stopLossTriggerPercent === percent ? "selected" : ""}
                onClick={() => {
                  if (stopLossTriggerPercent !== percent) {
                    setStopLossTriggerPercent(percent);
                  } else {
                    setStopLossTriggerPercent(null);
                  }
                }}
              >
                -{percent * 100}%
              </button>
            ))}
          </div>
          &nbsp;&nbsp;
          {(() => {
            if (showCustomSLInput) {
              return (
                <CustomInput>
                  <input
                    type="number"
                    max={100}
                    min={0}
                    step={0.01}
                    autoFocus
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) {
                        e.preventDefault();
                      }
                      if (e.key === "Enter") {
                        // Only keep 2 decimals
                        const value = parseFloat(e.currentTarget.value);
                        const precisionValue = Math.round(value * 100) / PERCENT_PRECISION;
                        if (precisionValue < 0 || precisionValue > 1 || isNaN(precisionValue)) {
                          setShowCustomSLInput(false);
                        } else {
                          setStopLossTriggerPercent(precisionValue);
                        }
                      }
                    }}
                    onBlur={() => setShowCustomSLInput(false)}
                  />
                  %
                </CustomInput>
              );
            } else if (STOP_LOSS_OPTIONS.includes(stopLossTriggerPercent) || !stopLossTriggerPercent) {
              return <button onClick={() => setShowCustomSLInput(true)}>Custom</button>;
            } else {
              return (
                <button className="selected" onClick={() => setShowCustomSLInput(true)}>
                  -{limitDecimals(stopLossTriggerPercent * 100, 2)}%{" "}
                  <MdEdit color="#000" style={{ padding: "2px 0 0 0" }} size={16} />
                </button>
              );
            }
          })()}
        </TriggerBoxPercent>
      </TriggerBox>
      <br />
      <TriggerBox className={takeProfitTriggerPercent ? "selected" : ""}>
        <h3>Take Profit</h3>
        <TriggerBoxPrice>
          <div>{takeProfitPrice ? formatAmount(takeProfitPrice, USD_DECIMALS, 2, true) : "—"}</div>
          <div>USD</div>
        </TriggerBoxPrice>
        <TriggerBoxPercent>
          <div>
            {TAKE_PROFIT_OPTIONS.map((percent) => (
              <button
                className={takeProfitTriggerPercent === percent ? "selected" : ""}
                onClick={() => {
                  if (takeProfitTriggerPercent !== percent) {
                    setTakeProfitTriggerPercent(percent);
                  } else {
                    setTakeProfitTriggerPercent(null);
                  }
                }}
              >
                {percent * 100}%
              </button>
            ))}
          </div>
          &nbsp;&nbsp;
          {(() => {
            if (showCustomTPInput) {
              return (
                <CustomInput>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    autoFocus
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) {
                        e.preventDefault();
                      }
                      if (e.key === "Enter") {
                        // Only keep 2 decimals
                        const value = parseFloat(e.currentTarget.value);
                        const precisionValue = parseFloat(value.toFixed(2));
                        if (precisionValue < 0 || isNaN(precisionValue)) {
                          setShowCustomTPInput(false);
                        } else {
                          setTakeProfitTriggerPercent(precisionValue / 100);
                        }
                      }
                    }}
                    onBlur={() => setShowCustomTPInput(false)}
                  />
                  %
                </CustomInput>
              );
            } else if (TAKE_PROFIT_OPTIONS.includes(takeProfitTriggerPercent) || !takeProfitTriggerPercent) {
              return <button onClick={() => setShowCustomTPInput(true)}>Custom</button>;
            } else {
              return (
                <button className="selected" onClick={() => setShowCustomTPInput(true)}>
                  {limitDecimals(takeProfitTriggerPercent * 100, 2)}%{" "}
                  <MdEdit color="#000" style={{ padding: "2px 0 0 0" }} size={16} />
                </button>
              );
            }
          })()}
        </TriggerBoxPercent>
      </TriggerBox>
    </Container>
  );
};

const Container = styled.div`
  border: 1px solid var(--cell-highlight);
  border-radius: 4px;
  padding: 16px;
  background: linear-gradient(0deg, rgba(0, 48, 0, 0.2), rgba(0, 48, 0, 0.2));
  margin: 16px 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-family: "Inter";
  font-size: 16px;
  line-height: 150%;
  height: 37px;
  color: #fff;

  & button {
    display: flex;
    align-items: center;
    background: var(--cell-stroke);
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    color: var(--action-active);
    font-size: 14px;
    line-height: 150%;
    transition: all 0.1s ease-in-out;

    &:hover {
      background: var(--action-active);
      color: #fff;
    }
  }
`;

const TriggerBox = styled.div`
  border: 1px solid var(--cell-highlight);
  border-radius: 4px;
  padding: 12px 16px;
  background: linear-gradient(0deg, rgba(0, 9, 0, 0.2), rgba(0, 9, 0, 0.2));

  &.selected {
    border-color: var(--cell-highlight);
  }

  h3 {
    margin: 0;
    font-weight: 400;
    color: var(--test-secondary);
    font-family: "Inter";
    font-size: 16px;
    line-height: 150%;
  }
`;

const TriggerBoxPrice = styled.div`
  display: flex;
  justify-content: space-between;
  color: var(--action-stroke);
  font-family: "Inter";
  font-weight: 600;
  font-size: 24px;
  line-height: 150%;

  .selected & {
    color: #fff;
  }
`;

const TriggerBoxPercent = styled.div`
  display: flex;
  align-items: center;

  & button {
    border: 1px solid var(--cell-stroke);
    background: transparent;
    color: var(--cell-stroke);
    font-size: 14px;
    line-height: 150%;
    border-radius: 4px;
    transition: all 0.1s ease-in-out;

    &:hover {
      border: 1px solid var(--cell-highlight);
      color: var(--cell-highlight);
    }
  }

  & button.selected {
    border: 1px solid var(--cell-highlight);
    color: #fff;
    background: var(--action-active);
  }

  /* The button group */
  & > div > button {
    border-radius: 0;

    &:first-child {
      border-radius: 4px 0 0 4px;
    }

    &:last-child {
      border-radius: 0 4px 4px 0;
    }
  }
`;

const CustomInput = styled.div`
  display: flex;
  align-items: center;
  padding: 0px 4px;
  max-width: 80px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid var(--cell-highlight);
  color: var(--cell-highlight);

  & > input {
    color: inherit;
    margin: 0;
    padding: 2px 4px;
    font-size: 14px;
    line-height: 140%;
  }
`;
