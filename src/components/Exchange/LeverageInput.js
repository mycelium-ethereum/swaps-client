import React, { useEffect } from 'react';
import styled from 'styled-components';
import Slider, { SliderTooltip } from "rc-slider";
import "rc-slider/assets/index.css";


const LeverageSliderHandle = (props) => {
    const { value, dragging, index, ...restProps } = props;
    return (
      <SliderTooltip
        prefixCls="rc-slider-tooltip"
        overlay={`${parseFloat(value).toFixed(2)}x`}
        visible={dragging}
        placement="top"
        key={index}
      >
        <Slider.Handle value={value} {...restProps} />
      </SliderTooltip>
    );
  };


export const LeverageInput = ({ value, onChange, max, min, step }) => {
    const [inputValue, setInputValue] = React.useState(value);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleInputChange = (e) => {
        let newValue = parseFloat(e.target.value);
        newValue = Math.round(newValue * 100) / 100;

        if (newValue < min) {
            onChange(min);
        } else if (newValue > max) {
            onChange(max);
        } else {
            onChange(newValue);
        }
    }

  return (
    <div className="Exchange-leverage-box">
      <InputBox>
        Leverage Slider
       
      </InputBox>
      <SliderRow>
        <Slider
          min={min}
          max={max}
          step={step}
          marks={{
            2: "2x",
            5: "5x",
            10: "10x",
            15: "15x",
            20: "20x",
            25: "25x",
            30: "30x",
          }}
          handle={LeverageSliderHandle}
          onChange={(value) => onChange(value)}
          value={value}
          defaultValue={value}
        />
         <Input
          type="number"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleInputChange(e);
            } else if (['e', 'E', '+', '-'].includes(e.key)) {
              e.preventDefault();
            }
          }}
          step={step}
          max={max}
          min={min}
        />
      </SliderRow>
    </div>
  );
};

const InputBox = styled.label`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: #fff;

    input {
        border: 1px solid var(--cell-stroke);
        border-radius: 4px;
        font-size: 1rem;
        text-align: right;
        width: 60px;
    }
`

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .rc-slider-rail {
    background: var(--action-inactive);
  }

  .rc-slider-track {
    background: var(--action-inactive);
  }

  .rc-slider-dot {
    border: none;
    border-radius: 1px;
    width: 2px;
    margin-left: -1px;
    background: var(--action-inactive);
  }

  .rc-slider-dot-active {
    background: var(--action-active);
  }

  .rc-slider-handle {
    background: var(--action-active);
    border: solid 2px var(--action-active);
  }

  .rc-slider-handle:active {
    box-shadow: 0 0 4px 6px rgba(45, 66, 252, 0.2);
  }

  .rc-slider-mark-text,
  .rc-slider-mark-text-active {
    color: white;
    opacity: 0.5;
  }

  .rc-slider-mark-text:hover,
  .rc-slider-mark-text-active:hover {
    opacity: 1;
  }
`;

const Input = styled.input`
    margin-left: 16px;
    border: 1px solid var(--action-active);
    color: var(--action-active);
    border-radius: 4px;
    font-size: 16px;
    text-align: center;
    width: 70px;
    height: 32px; 
    padding: 2px 6px;
`;