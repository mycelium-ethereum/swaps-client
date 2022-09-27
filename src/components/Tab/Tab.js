import React from "react";

import cx from "classnames";

import "./Tab.css";

export default function Tab(props) {
  const {
    options,
    option,
    setOption,
    onChange,
    type = "block",
    className,
    optionLabels,
    icons,
    trackAction,
    hideSelected,
  } = props;
  const onClick = (opt) => {
    if (setOption) {
      setOption(opt);
      trackAction &&
        trackAction("Button clicked", {
          buttonName: `Tab option - ${opt}`,
        });
    }
    if (onChange) {
      onChange(opt);
    }
  };

  return (
    <div className={cx("Tab", type, className)}>
      {options.map((opt, i) => {
        const label = optionLabels && optionLabels[opt] ? optionLabels[opt] : opt;
        return (
          <div
            className={cx("Tab-option", "muted", {
              active: (opt === option && !hideSelected) || (hideSelected && i === 0),
            })}
            onClick={() => onClick(opt)}
            key={opt}
          >
            {icons && icons[opt] && <img className="Tab-option-icon" src={icons[opt]} alt={option} />}
            {label}
          </div>
        );
      })}
    </div>
  );
}
