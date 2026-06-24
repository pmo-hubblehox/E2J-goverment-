import React, { useEffect, useRef, useState } from "react";

export default function OTPInput({ length = 6, value = "", onChange, disabled }) {
  const [values, setValues] = useState(() => {
    const filled = [...value].slice(0, length);
    return Array.from({ length }, (_, idx) => filled[idx] || "");
  });

  const inputsRef = useRef([]);

  useEffect(() => {
    const filled = [...value].slice(0, length);
    setValues(Array.from({ length }, (_, idx) => filled[idx] || ""));
  }, [length, value]);

  const updateValue = (nextValues) => {
    setValues(nextValues);
    onChange(nextValues.join(""));
  };

  const handleChange = (index) => (event) => {
    const entered = event.target.value.replace(/[^0-9]/g, "");
    if (!entered) {
      updateValue(values);
      return;
    }

    const next = [...values];
    next[index] = entered.slice(-1);
    updateValue(next);

    const nextIndex = index + 1;
    if (nextIndex < length) {
      inputsRef.current[nextIndex]?.focus();
    }
  };

  const handleKeyDown = (index) => (event) => {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      const prevIndex = index - 1;
      inputsRef.current[prevIndex]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const paste = (event.clipboardData || window.clipboardData).getData("text").trim();
    if (!paste) return;

    const digits = paste.replace(/\D/g, "").slice(0, length).split("");
    const next = [...values];
    for (let i = 0; i < digits.length; i += 1) {
      next[i] = digits[i];
    }

    updateValue(next);
    const focusIndex = Math.min(digits.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div
      className="otp-grid"
      onPaste={handlePaste}
      role="group"
      aria-label="One-time passcode input"
    >
      {values.map((digit, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          ref={(el) => (inputsRef.current[index] = el)}
          className="otp-input"
          autoComplete="one-time-code"
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
