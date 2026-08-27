import { iso31661, iso31662 } from "iso-3166";

export type AddressCountry = { code: string; name: string };
export type AddressSubdivision = { code: string; name: string };

export const addressCountries: AddressCountry[] = iso31661
  .map((country) => ({ code: country.alpha2, name: country.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getCountrySubdivisions(
  countryCode: string,
): AddressSubdivision[] {
  return iso31662
    .filter((subdivision) => subdivision.parent === countryCode)
    .map((subdivision) => ({ code: subdivision.code, name: subdivision.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getSubdivisionValue(
  value: string | undefined,
  subdivisions: AddressSubdivision[],
) {
  const normalized = value?.toLocaleLowerCase();
  return (
    subdivisions.find((item) =>
      [item.name, item.code, item.code.split("-").slice(1).join("-")].some(
        (candidate) => candidate.toLocaleLowerCase() === normalized,
      ),
    )?.name ?? ""
  );
}

export function isAddressCountryValid(address: {
  country: string;
  state?: string;
}) {
  const country = addressCountries.find(
    (item) => item.code === address.country.toUpperCase(),
  );
  if (!country) return false;

  const subdivisions = getCountrySubdivisions(country.code);
  if (!subdivisions.length) return true;

  return Boolean(getSubdivisionValue(address.state, subdivisions));
}
