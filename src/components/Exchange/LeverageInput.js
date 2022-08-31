import React, { useEffect } from 'react';
import styled from 'styled-components';
import Slider, { SliderTooltip } from "rc-slider";


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
        newValue = Math.round(newValue * 10) / 10;

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
        Leverage
        <input
          type="number"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleInputChange(e);
            }
          }}
          step={step}
          max={max}
          min={min}
        />
      </InputBox>
      <div className="Exchange-leverage-slider App-slider">
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
      </div>
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
        width: 80px;
    }
`
