import React, { useState } from "react";

const TITLES = ["Mr", "Ms", "Mrs", "Dr", "Prof"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function Field({ label, required, error, children }) {
  return (
    <div className="profile-field">
      <label className="profile-field__label">
        {label}{required && <span className="profile-required" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && <span className="profile-error" role="alert">{error}</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled, type = "text", hasError, ...rest }) {
  return (
    <input
      type={type}
      className={`profile-input${hasError ? " profile-input--error" : ""}`}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      {...rest}
    />
  );
}

function Select({ value, onChange, options, placeholder, hasError }) {
  return (
    <select className={`profile-select${hasError ? " profile-input--error" : ""}`} value={value || ""} onChange={onChange}>
      <option value="">{placeholder || "Select..."}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function AddressBlock({ values, onChange, label, errors = {}, prefix }) {
  const handle = (field) => (e) => onChange({ ...values, [field]: e.target.value });
  const isPresent = prefix === "present";
  return (
    <div className="profile-address-block">
      <h4 className="profile-address-title">{label}</h4>
      <div className="profile-grid-2">
        <Field label="Address Line 1" required={isPresent} error={errors[`address.line1`]}>
          <TextInput value={values?.line1} onChange={handle("line1")} placeholder="Street address" hasError={!!errors[`address.line1`]} />
        </Field>
        <Field label="Address Line 2">
          <TextInput value={values?.line2} onChange={handle("line2")} placeholder="Apt, suite, etc." />
        </Field>
        <Field label="City" required={isPresent} error={errors["address.city"]}>
          <TextInput value={values?.city} onChange={handle("city")} placeholder="City" hasError={!!errors["address.city"]} />
        </Field>
        <Field label="State" required={isPresent} error={errors["address.state"]}>
          <TextInput value={values?.state} onChange={handle("state")} placeholder="State" hasError={!!errors["address.state"]} />
        </Field>
        <Field label="Country" required={isPresent} error={errors["address.country"]}>
          <TextInput value={values?.country} onChange={handle("country")} placeholder="Country" hasError={!!errors["address.country"]} />
        </Field>
        <Field label="Pincode" required={isPresent} error={errors["address.pincode"]}>
          <TextInput value={values?.pincode} onChange={handle("pincode")} placeholder="Pincode" hasError={!!errors["address.pincode"]} />
        </Field>
      </div>
    </div>
  );
}

export default function StepPersonal({ data, onChange, errors = {} }) {
  const [sameAddress, setSameAddress] = useState(false);
  const set = (field) => (e) => onChange({ [field]: e.target.value });
  const setNested = (field) => (val) => onChange({ [field]: val });

  const handleSameAddress = (e) => {
    setSameAddress(e.target.checked);
    if (e.target.checked) {
      onChange({ permanentAddress: { ...data.presentAddress } });
    }
  };

  return (
    <div className="profile-step">
      <h3 className="profile-step__title">Personal Information</h3>

      <section className="profile-section">
        <h4 className="profile-section__heading">Basic Details</h4>
        <div className="profile-grid-4">
          <Field label="Title" required error={errors.title}>
            <Select value={data.title} onChange={set("title")} options={TITLES} hasError={!!errors.title} />
          </Field>
          <Field label="First Name" required error={errors.firstName}>
            <TextInput value={data.firstName} onChange={set("firstName")} placeholder="First name" hasError={!!errors.firstName} />
          </Field>
          <Field label="Middle Name">
            <TextInput value={data.middleName} onChange={set("middleName")} placeholder="Middle name" />
          </Field>
          <Field label="Last Name" required error={errors.lastName}>
            <TextInput value={data.lastName} onChange={set("lastName")} placeholder="Last name" hasError={!!errors.lastName} />
          </Field>
        </div>
        <div className="profile-grid-3">
          <Field label="Date of Birth" required error={errors.dob}>
            <TextInput type="date" value={data.dob} onChange={set("dob")} hasError={!!errors.dob} />
          </Field>
          <Field label="Gender" required error={errors.gender}>
            <Select value={data.gender} onChange={set("gender")} options={GENDERS} hasError={!!errors.gender} />
          </Field>
          <Field label="Nationality" required error={errors.nationality}>
            <TextInput value={data.nationality} onChange={set("nationality")} placeholder="e.g. Indian" hasError={!!errors.nationality} />
          </Field>
          <Field label="Marital Status">
            <Select value={data.maritalStatus} onChange={set("maritalStatus")} options={MARITAL} />
          </Field>
          <Field label="Physically Challenged">
            <Select value={data.physicallyChallenged} onChange={set("physicallyChallenged")} options={["No", "Yes"]} />
          </Field>
          <Field label="Blood Group">
            <Select value={data.bloodGroup} onChange={set("bloodGroup")} options={BLOOD_GROUPS} />
          </Field>
        </div>
      </section>

      <section className="profile-section">
        <h4 className="profile-section__heading">Contact</h4>
        <div className="profile-grid-2">
          <Field label="Email" required error={errors.email}>
            <TextInput value={data.email} disabled hasError={!!errors.email} />
          </Field>
          <Field label="Mobile (Primary)" required error={errors.mobilePrimary}>
            <TextInput type="tel" value={data.mobilePrimary} onChange={set("mobilePrimary")} placeholder="10-digit mobile number" hasError={!!errors.mobilePrimary} pattern="[0-9]{10}" inputMode="numeric" maxLength={10} />
          </Field>
          <Field label="Mobile (Alternate)">
            <TextInput type="tel" value={data.mobileAlternate} onChange={set("mobileAlternate")} placeholder="+91 XXXXX XXXXX" />
          </Field>
        </div>
      </section>

      <section className="profile-section">
        <AddressBlock
          prefix="present"
          label="Present Address"
          values={data.presentAddress}
          onChange={setNested("presentAddress")}
          errors={errors}
        />
        <label className="profile-checkbox-label">
          <input type="checkbox" checked={sameAddress} onChange={handleSameAddress} />
          <span>Permanent address same as present address</span>
        </label>
        {!sameAddress && (
          <AddressBlock
            prefix="permanent"
            label="Permanent Address"
            values={data.permanentAddress}
            onChange={setNested("permanentAddress")}
            errors={{}}
          />
        )}
      </section>

      <section className="profile-section">
        <h4 className="profile-section__heading">Social Media</h4>
        <div className="profile-grid-2">
          <Field label="LinkedIn URL">
            <TextInput value={data.socialMedia?.linkedin} onChange={(e) => onChange({ socialMedia: { ...data.socialMedia, linkedin: e.target.value } })} placeholder="https://linkedin.com/in/..." />
          </Field>
          <Field label="GitHub URL">
            <TextInput value={data.socialMedia?.github} onChange={(e) => onChange({ socialMedia: { ...data.socialMedia, github: e.target.value } })} placeholder="https://github.com/..." />
          </Field>
          <Field label="Portfolio URL">
            <TextInput value={data.socialMedia?.portfolio} onChange={(e) => onChange({ socialMedia: { ...data.socialMedia, portfolio: e.target.value } })} placeholder="https://yourportfolio.com" />
          </Field>
        </div>
      </section>
    </div>
  );
}
