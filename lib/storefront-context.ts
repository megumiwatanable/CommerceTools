import "server-only";
import { addressCountries, getCountrySubdivisions } from "@/lib/country-data";
import { apiRoot } from "@/lib/ct-client";
import { cache } from "react";

export type StorefrontCountry = { code: string; name: string };
export type StorefrontOption = {
  id: string;
  key: string;
  name: string;
  countries: StorefrontCountry[];
  languages: string[];
};

const countryNames = new Map(
  addressCountries.map((country) => [country.code, country.name]),
);

export const getStorefrontOptions = cache(
  async (): Promise<StorefrontOption[]> => {
    const [stores, project] = await Promise.all([
      fetchAllStores(),
      apiRoot.get().execute(),
    ]);
    const projectCountries = project.body.countries ?? [];
    return stores.map((store) => {
      const countryCodes = store.countries.length
        ? store.countries.map((country: { code: string }) => country.code)
        : projectCountries;
      return {
        id: store.id,
        key: store.key,
        name:
          store.name?.["en-US"] ??
          store.name?.["en-GB"] ??
          Object.values(store.name ?? {})[0] ??
          store.key,
        countries: countryCodes.map((code: string) => ({
          code,
          name: countryNames.get(code) ?? code,
        })),
        languages: store.languages.length
          ? store.languages
          : project.body.languages,
      };
    });
  },
);

export async function resolveStorefrontContext(
  storeKey?: string,
  countryCode?: string,
) {
  const stores = await getStorefrontOptions();
  const store = stores.find((item) => item.key === storeKey) ?? stores[0];
  if (!store)
    throw new Error(
      "No commercetools Store is configured for this storefront.",
    );
  const country =
    store.countries.find((item) => item.code === countryCode) ??
    store.countries[0];
  if (!country)
    throw new Error(
      `Store ${store.key} has no configured or project fallback country.`,
    );
  const locale =
    store.languages.find((language) =>
      language.toUpperCase().endsWith(`-${country.code}`),
    ) ??
    store.languages[0] ??
    "en";
  return {
    stores,
    store,
    country,
    locale,
    subdivisions: getCountrySubdivisions(country.code),
  };
}

async function fetchAllStores() {
  const results: any[] = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const response = await apiRoot
      .stores()
      .get({ queryArgs: { limit, offset } })
      .execute();
    results.push(...response.body.results);
    if (response.body.results.length < limit) break;
  }
  return results;
}
