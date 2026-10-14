
"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type AccountType = "paper" | "live";

type DisclosureState = {
  isControlPerson: boolean;
  isAffiliatedExchangeOrFinra: boolean;
  isPoliticallyExposed: boolean;
  immediateFamilyExposed: boolean;
};

const initialDisclosures: DisclosureState = {
  isControlPerson: false,
  isAffiliatedExchangeOrFinra: false,
  isPoliticallyExposed: false,
  immediateFamilyExposed: false,
};

export default function OpenAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --------------------------------------------------
  // Account type
  // --------------------------------------------------

  const accountType: AccountType =
    searchParams.get("type") === "live"
      ? "live"
      : "paper";

  const isLiveAccount = accountType === "live";

  // --------------------------------------------------
  // UI state
  // --------------------------------------------------

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // Personal information
  // --------------------------------------------------

  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // --------------------------------------------------
  // Address
  // --------------------------------------------------

  const [streetAddress, setStreetAddress] =
    useState("");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  // --------------------------------------------------
  // Tax information
  // --------------------------------------------------

  const [taxId, setTaxId] = useState("");
  const [taxIdType, setTaxIdType] = useState("");

  const [
    countryOfTaxResidence,
    setCountryOfTaxResidence,
  ] = useState("");

  // --------------------------------------------------
  // Employment information
  // --------------------------------------------------

  const [
    employmentStatus,
    setEmploymentStatus,
  ] = useState("");

  const [employerName, setEmployerName] =
    useState("");

  const [occupation, setOccupation] =
    useState("");

  // --------------------------------------------------
  // Financial information
  // --------------------------------------------------

  const [fundingSource, setFundingSource] =
    useState<string[]>([]);

  const [riskTolerance, setRiskTolerance] =
    useState("");

  // --------------------------------------------------
  // Disclosures
  // --------------------------------------------------

  const [disclosures, setDisclosures] =
    useState<DisclosureState>(
      initialDisclosures
    );

  // --------------------------------------------------
  // Agreements
  // --------------------------------------------------

  const [
    agreementsAccepted,
    setAgreementsAccepted,
  ] = useState(false);

  // --------------------------------------------------
  // Funding source checkbox
  // --------------------------------------------------

  function toggleFundingSource(
    value: string
  ) {
    setFundingSource((current) =>
      current.includes(value)
        ? current.filter(
            (item) => item !== value
          )
        : [...current, value]
    );
  }

  // --------------------------------------------------
  // Disclosure checkbox
  // --------------------------------------------------

  function updateDisclosure(
    key: keyof DisclosureState
  ) {
    setDisclosures((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  // --------------------------------------------------
  // Submit form
  // --------------------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ----------------------------------------------
    // Frontend validation
    // ----------------------------------------------

    if (!agreementsAccepted) {
      setError(
        "Please accept the required agreements."
      );
      return;
    }

    if (fundingSource.length === 0) {
      setError(
        "Please select at least one source of funds."
      );
      return;
    }

    if (!riskTolerance) {
      setError(
        "Please select your risk tolerance."
      );
      return;
    }

    if (!employmentStatus) {
      setError(
        "Please select your employment status."
      );
      return;
    }

    if (!country) {
      setError("Please select your country.");
      return;
    }

    if (!countryOfTaxResidence) {
      setError(
        "Please select your country of tax residence."
      );
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------
      // 1. Save trading profile
      // --------------------------------------------

      const profileResponse =
        await fetch(
          "/api/trading/profile",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              givenName,
              familyName,
              phoneNumber,
              dateOfBirth,

              streetAddress: [
                streetAddress,
              ],

              city,
              state,
              postalCode,
              country,

              taxId,
              taxIdType,
              countryOfTaxResidence,

              employmentStatus,

              employerName,
              occupation,

              fundingSource,

              riskTolerance,

              disclosures,

              agreementsAccepted,
            }),
          }
        );

      const profileData =
        await profileResponse.json();

      if (
        !profileResponse.ok ||
        !profileData.success
      ) {
        throw new Error(
          profileData.message ||
            "Unable to save trading profile."
        );
      }

      setSuccess(
        isLiveAccount
          ? "Profile saved. Creating your real trading account..."
          : "Profile saved. Creating your demo trading account..."
      );

      // --------------------------------------------
      // 2. Create Alpaca trading account
      // --------------------------------------------

      const accountResponse =
        await fetch(
          "/api/trading/accounts",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              accountType,
            }),
          }
        );

      const accountData =
        await accountResponse.json();

      if (
        !accountResponse.ok ||
        !accountData.success
      ) {
        throw new Error(
          accountData.message ||
            "Trading account creation failed."
        );
      }

      // --------------------------------------------
      // 3. Success
      // --------------------------------------------

      setSuccess(
        isLiveAccount
          ? "Real trading account created successfully. Redirecting..."
          : "Demo trading account created successfully. Redirecting..."
      );

      setTimeout(() => {
        if (isLiveAccount) {
          router.push(
            "/dashboard/mt5/real"
          );
        } else {
          router.push(
            "/dashboard/mt5/demo"
          );
        }
      }, 800);
    } catch (error) {
      console.error(
        "OPEN ACCOUNT ERROR:",
        error
      );

      setSuccess("");

      setError(
        error instanceof Error
          ? error.message
          : "Unable to open trading account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">

        {/* ---------------------------------------- */}
        {/* Header */}
        {/* ---------------------------------------- */}

        <div className="mb-6">
          <Link
            href="/dashboard/accounts"
            className="text-sm text-text-muted transition hover:text-text"
          >
            ← Back to Accounts
          </Link>

          <h1 className="mt-4 font-display text-2xl font-semibold text-text">
            {isLiveAccount
              ? "Open Real Trading Account"
              : "Open Demo Trading Account"}
          </h1>

          <p className="mt-1 text-sm text-text-muted">
            Complete your trading profile with
            your actual information.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* -------------------------------------- */}
          {/* Personal Information */}
          {/* -------------------------------------- */}

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-text-muted">
              Enter your legal name and personal
              information.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <Field
                label="First Name"
                value={givenName}
                onChange={setGivenName}
                required
              />

              <Field
                label="Last Name"
                value={familyName}
                onChange={setFamilyName}
                required
              />

              <Field
                label="Phone Number"
                value={phoneNumber}
                onChange={setPhoneNumber}
                type="tel"
                required
              />

              <Field
                label="Date of Birth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                type="date"
                required
              />

            </div>
          </section>

          {/* -------------------------------------- */}
          {/* Residential Address */}
          {/* -------------------------------------- */}

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">
              Residential Address
            </h2>

            <div className="mt-5 space-y-4">

              <Field
                label="Street Address"
                value={streetAddress}
                onChange={setStreetAddress}
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">

                <Field
                  label="City"
                  value={city}
                  onChange={setCity}
                  required
                />

                <Field
                  label="State / Province"
                  value={state}
                  onChange={setState}
                  required
                />

                <Field
                  label="Postal Code"
                  value={postalCode}
                  onChange={setPostalCode}
                  required
                />

                {/* Country */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Country
                  </label>

                  <select
                    value={country}
                    onChange={(event) =>
                      setCountry(
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                  >
                    <option value="">
                      Select country
                    </option>

                    <option value="IND">
                      India
                    </option>

                    <option value="USA">
                      United States
                    </option>

                    <option value="CAN">
                      Canada
                    </option>

                    <option value="GBR">
                      United Kingdom
                    </option>

                    <option value="AUS">
                      Australia
                    </option>

                    <option value="DEU">
                      Germany
                    </option>

                    <option value="FRA">
                      France
                    </option>

                    <option value="SGP">
                      Singapore
                    </option>

                    <option value="ARE">
                      United Arab Emirates
                    </option>
                  </select>
                </div>

              </div>
            </div>
          </section>

          {/* -------------------------------------- */}
          {/* Tax Information */}
          {/* -------------------------------------- */}

          <section className="rounded-xl border border-border bg-surface p-6">

            <h2 className="text-lg font-semibold text-text">
              Tax Information
            </h2>

            <p className="mt-1 text-sm text-text-muted">
              Enter your actual tax information.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <Field
                label="Tax ID"
                value={taxId}
                onChange={setTaxId}
                placeholder="Example: PAN"
                required
              />

              <Field
                label="Tax ID Type"
                value={taxIdType}
                onChange={setTaxIdType}
                placeholder="Example: PAN"
                required
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">
                  Country of Tax Residence
                </label>

                <select
                  value={
                    countryOfTaxResidence
                  }
                  onChange={(event) =>
                    setCountryOfTaxResidence(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                >
                  <option value="">
                    Select country
                  </option>

                  <option value="IND">
                    India
                  </option>

                  <option value="USA">
                    United States
                  </option>

                  <option value="CAN">
                    Canada
                  </option>

                  <option value="GBR">
                    United Kingdom
                  </option>

                  <option value="AUS">
                    Australia
                  </option>

                  <option value="DEU">
                    Germany
                  </option>

                  <option value="FRA">
                    France
                  </option>

                  <option value="SGP">
                    Singapore
                  </option>

                  <option value="ARE">
                    United Arab Emirates
                  </option>
                </select>
              </div>

            </div>
          </section>

          {/* -------------------------------------- */}
          {/* Employment Information */}
          {/* -------------------------------------- */}

          <section className="rounded-xl border border-border bg-surface p-6">

            <h2 className="text-lg font-semibold text-text">
              Employment Information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">
                  Employment Status
                </label>

                <select
                  value={employmentStatus}
                  onChange={(event) =>
                    setEmploymentStatus(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                >
                  <option value="">
                    Select employment status
                  </option>

                  <option value="EMPLOYED">
                    Employed
                  </option>

                  <option value="UNEMPLOYED">
                    Unemployed
                  </option>

                  <option value="RETIRED">
                    Retired
                  </option>

                  <option value="STUDENT">
                    Student
                  </option>
                </select>
              </div>

              <Field
                label="Employer Name"
                value={employerName}
                onChange={setEmployerName}
              />

              <Field
                label="Occupation"
                value={occupation}
                onChange={setOccupation}
              />

            </div>
          </section>

          {/* -------------------------------------- */}
          {/* Financial Information */}
          {/* -------------------------------------- */}

          <section className="rounded-xl border border-border bg-surface p-6">

            <h2 className="text-lg font-semibold text-text">
              Financial Information
            </h2>

            <div className="mt-5">

              <p className="mb-3 text-sm font-medium text-text">
                Source of Funds
              </p>

              <div className="grid gap-3 sm:grid-cols-2">

                {[
                  [
                    "employment_income",
                    "Employment Income",
                  ],
                  [
                    "business_income",
                    "Business Income",
                  ],
                  [
                    "investment",
                    "Investment",
                  ],
                  [
                    "inheritance",
                    "Inheritance",
                  ],
                  [
                    "savings",
                    "Savings",
                  ],
                  [
                    "other",
                    "Other",
                  ],
                ].map(
                  ([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <input
                        type="checkbox"
                        checked={fundingSource.includes(
                          value
                        )}
                        onChange={() =>
                          toggleFundingSource(
                            value
                          )
                        }
                      />

                      <span className="text-sm text-text">
                        {label}
                      </span>
                    </label>
                  )
                )}

              </div>
            </div>

            <div className="mt-6">

              <label className="mb-1.5 block text-sm font-medium text-text">
                Risk Tolerance
              </label>

              <select
                value={riskTolerance}
                onChange={(event) =>
                  setRiskTolerance(
                    event.target.value
                  )
                }
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
              >
                <option value="">
                  Select risk tolerance
                </option>

                <option value="conservative">
                  Conservative
                </option>

                <option value="moderate">
                  Moderate
                </option>

                <option value="significant_risk">
                  Significant Risk
                </option>
              </select>

            </div>
          </section>

          {/* -------------------------------------- */}
          {/* Disclosures */}
          {/* -------------------------------------- */}

          <section className="rounded-xl border border-border bg-surface p-6">

            <h2 className="text-lg font-semibold text-text">
              Disclosures
            </h2>

            <div className="mt-5 space-y-3">

              <Disclosure
                checked={
                  disclosures.isControlPerson
                }
                onChange={() =>
                  updateDisclosure(
                    "isControlPerson"
                  )
                }
                text="I am a control person of a publicly traded company."
              />

              <Disclosure
                checked={
                  disclosures
                    .isAffiliatedExchangeOrFinra
                }
                onChange={() =>
                  updateDisclosure(
                    "isAffiliatedExchangeOrFinra"
                  )
                }
                text="I am affiliated with a stock exchange, FINRA, or another financial regulatory organization."
              />

              <Disclosure
                checked={
                  disclosures
                    .isPoliticallyExposed
                }
                onChange={() =>
                  updateDisclosure(
                    "isPoliticallyExposed"
                  )
                }
                text="I am a politically exposed person."
              />

              <Disclosure
                checked={
                  disclosures
                    .immediateFamilyExposed
                }
                onChange={() =>
                  updateDisclosure(
                    "immediateFamilyExposed"
                  )
                }
                text="An immediate family member is a politically exposed person."
              />

            </div>
          </section>

          {/* -------------------------------------- */}
          {/* Agreement */}
          {/* -------------------------------------- */}

          <section className="rounded-xl border border-border bg-surface p-6">

            <label className="flex cursor-pointer items-start gap-3">

              <input
                type="checkbox"
                checked={
                  agreementsAccepted
                }
                onChange={(event) =>
                  setAgreementsAccepted(
                    event.target.checked
                  )
                }
                className="mt-1"
              />

              <span className="text-sm leading-6 text-text">
                I confirm that the information
                I have provided is accurate and
                I agree to the applicable account
                opening terms and disclosures.
              </span>

            </label>
          </section>

          {/* -------------------------------------- */}
          {/* Error */}
          {/* -------------------------------------- */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

              <p className="font-semibold">
                Account creation failed
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>
          )}

          {/* -------------------------------------- */}
          {/* Success */}
          {/* -------------------------------------- */}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          )}

          {/* -------------------------------------- */}
          {/* Submit */}
          {/* -------------------------------------- */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent-2 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? isLiveAccount
                ? "Creating Real Trading Account..."
                : "Creating Demo Trading Account..."
              : isLiveAccount
                ? "Create Real Trading Account"
                : "Create Demo Trading Account"}
          </button>

        </form>
      </div>
    </main>
  );
}

// ==================================================
// Reusable Field component
// ==================================================

type FieldProps = {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-text">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent-2"
      />
    </div>
  );
}

// ==================================================
// Disclosure component
// ==================================================

type DisclosureProps = {
  checked: boolean;
  onChange: () => void;
  text: string;
};

function Disclosure({
  checked,
  onChange,
  text,
}: DisclosureProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1"
      />

      <span className="text-sm leading-6 text-text">
        {text}
      </span>

    </label>
  );
}
