import React, { useId } from "react";

export default function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  error,
  required,
  autoComplete,
  ...rest
}) {
  const errorId = useId();
  const hasError = Boolean(error);

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`form-input${hasError ? " form-input--error" : ""}`}
        autoComplete={autoComplete ?? (type === "password" ? "current-password" : "off")}
        aria-required={required ? "true" : undefined}
        aria-invalid={hasError ? "true" : undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...rest}
      />
      {hasError && (
        <div id={errorId} className="input-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
