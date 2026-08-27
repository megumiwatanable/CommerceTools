"use client";

import { useMemo, useState } from "react";
import {
  addressCountries,
  getCountrySubdivisions,
  getSubdivisionValue,
} from "@/lib/country-data";

export default function AddressCountryFields({
  defaultCountry,
  defaultState,
  countryName = "country",
  stateName = "state",
  idPrefix,
}: {
  defaultCountry: string;
  defaultState?: string;
  countryName?: string;
  stateName?: string;
  idPrefix: string;
}) {
  const initialCountry = addressCountries.some(
    (country) => country.code === defaultCountry,
  )
    ? defaultCountry
    : addressCountries[0]?.code;
  const [countryCode, setCountryCode] = useState(initialCountry);
  const [state, setState] = useState(defaultState ?? "");
  const subdivisions = useMemo(
    () => getCountrySubdivisions(countryCode),
    [countryCode],
  );
  const selectedState = getSubdivisionValue(state, subdivisions);

  return (
    <>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-country`}>Country</label>
        <select
          className="input"
          id={`${idPrefix}-country`}
          name={countryName}
          value={countryCode}
          onChange={(event) => {
            setCountryCode(event.target.value);
            setState("");
          }}
          required
        >
          {addressCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-state`}>State / Province</label>
        {subdivisions.length ? (
          <select
            className="input"
            id={`${idPrefix}-state`}
            name={stateName}
            value={selectedState}
            onChange={(event) => setState(event.target.value)}
            required
          >
            <option value="">Select state / province</option>
            {subdivisions.map((subdivision) => (
              <option key={subdivision.code} value={subdivision.name}>
                {subdivision.name}
              </option>
            ))}
          </select>
        ) : (
          <input type="hidden" name={stateName} value="" />
        )}
      </div>
    </>
  );
}
