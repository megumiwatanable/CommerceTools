export type CheckoutAddress = {
  firstName: string;
  lastName: string;
  streetName: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
};

export function createCheckoutAddress(values: {
  firstName: unknown;
  lastName: unknown;
  streetName: unknown;
  city: unknown;
  postalCode: unknown;
  country: unknown;
  state?: unknown;
}): CheckoutAddress | null {
  const required = [
    values.firstName,
    values.lastName,
    values.streetName,
    values.city,
    values.postalCode,
    values.country,
  ];
  if (!required.every((value) => typeof value === "string" && value.trim())) {
    return null;
  }

  const [firstName, lastName, streetName, city, postalCode, country] =
    required as string[];
  const state = typeof values.state === "string" ? values.state.trim() : "";
  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    streetName: streetName.trim(),
    city: city.trim(),
    postalCode: postalCode.trim(),
    country: country.trim(),
    ...(state ? { state } : {}),
  };
}
