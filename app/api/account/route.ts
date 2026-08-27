import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { isAddressCountryValid } from "@/lib/country-data";
import { withFlash } from "@/lib/flash";

function redirect(
  request: NextRequest,
  status: "saved" | "error",
  pathname = "/account",
) {
  const url = new URL(pathname, request.url);
  return withFlash(
    NextResponse.redirect(url),
    status === "error"
      ? "generic_error"
      : pathname === "/account/addresses"
        ? "address_saved"
        : "account_saved",
  );
}

const value = (form: FormData, name: string) => {
  const field = form.get(name);
  return typeof field === "string" ? field.trim() : "";
};

export async function POST(request: NextRequest) {
  const customerId = request.cookies.get("commerce_customer_id")?.value;
  if (!customerId) return redirect(request, "error");

  const form = await request.formData();
  const action = value(form, "action");
  const target = [
    "address",
    "edit-address",
    "delete-address",
    "default-address",
  ].includes(action)
    ? "/account/addresses"
    : "/account/profile";

  try {
    const customer = (
      await apiRoot.customers().withId({ ID: customerId }).get().execute()
    ).body;

    if (action === "profile") {
      const firstName = value(form, "firstName");
      const lastName = value(form, "lastName");
      const email = value(form, "email");
      if (!firstName || !lastName || !email)
        return redirect(request, "error", target);
      await apiRoot
        .customers()
        .withId({ ID: customer.id })
        .post({
          body: {
            version: customer.version,
            actions: [
              { action: "setFirstName", firstName },
              { action: "setLastName", lastName },
              ...(email !== customer.email
                ? [{ action: "changeEmail" as const, email }]
                : []),
            ],
          },
        })
        .execute();
    } else if (action === "address") {
      const firstName = value(form, "firstName");
      const lastName = value(form, "lastName");
      const streetName = value(form, "streetName");
      const city = value(form, "city");
      const postalCode = value(form, "postalCode");
      const country = value(form, "country");
      const state = value(form, "state");
      if (
        ![firstName, lastName, streetName, city, postalCode, country].every(
          Boolean,
        )
      )
        return redirect(request, "error", target);
      if (!isAddressCountryValid({ country, state }))
        return redirect(request, "error", target);
      await apiRoot
        .customers()
        .withId({ ID: customer.id })
        .post({
          body: {
            version: customer.version,
            actions: [
              {
                action: "addAddress",
                address: {
                  firstName,
                  lastName,
                  streetName,
                  city,
                  postalCode,
                  country,
                  ...(state ? { state } : {}),
                },
              },
            ],
          },
        })
        .execute();
    } else if (action === "edit-address") {
      const addressId = value(form, "addressId");
      const firstName = value(form, "firstName");
      const lastName = value(form, "lastName");
      const streetName = value(form, "streetName");
      const city = value(form, "city");
      const postalCode = value(form, "postalCode");
      const country = value(form, "country");
      const state = value(form, "state");
      if (
        !addressId ||
        !customer.addresses.some((address) => address.id === addressId) ||
        ![firstName, lastName, streetName, city, postalCode, country].every(
          Boolean,
        ) ||
        !isAddressCountryValid({ country, state })
      ) {
        return redirect(request, "error", target);
      }
      await apiRoot
        .customers()
        .withId({ ID: customer.id })
        .post({
          body: {
            version: customer.version,
            actions: [
              {
                action: "changeAddress",
                addressId,
                address: {
                  firstName,
                  lastName,
                  streetName,
                  city,
                  postalCode,
                  country,
                  ...(state ? { state } : {}),
                },
              },
            ],
          },
        })
        .execute();
    } else if (action === "delete-address") {
      const addressId = value(form, "addressId");
      if (
        !addressId ||
        !customer.addresses.some((address) => address.id === addressId)
      ) {
        return redirect(request, "error", target);
      }
      await apiRoot
        .customers()
        .withId({ ID: customer.id })
        .post({
          body: {
            version: customer.version,
            actions: [
              ...(customer.defaultShippingAddressId === addressId
                ? [{ action: "setDefaultShippingAddress" as const }]
                : []),
              ...(customer.defaultBillingAddressId === addressId
                ? [{ action: "setDefaultBillingAddress" as const }]
                : []),
              { action: "removeAddress", addressId },
            ],
          },
        })
        .execute();
    } else if (action === "default-address") {
      const addressId = value(form, "addressId");
      if (
        !addressId ||
        !customer.addresses.some((address) => address.id === addressId)
      )
        return redirect(request, "error", target);
      await apiRoot
        .customers()
        .withId({ ID: customer.id })
        .post({
          body: {
            version: customer.version,
            actions: [
              { action: "setDefaultShippingAddress", addressId },
              { action: "setDefaultBillingAddress", addressId },
            ],
          },
        })
        .execute();
    } else if (action === "password") {
      const currentPassword = value(form, "currentPassword");
      const newPassword = value(form, "newPassword");
      const confirmPassword = value(form, "confirmPassword");
      if (
        !currentPassword ||
        newPassword.length < 8 ||
        newPassword !== confirmPassword
      )
        return redirect(request, "error", target);
      await apiRoot
        .customers()
        .password()
        .post({
          body: {
            id: customer.id,
            version: customer.version,
            currentPassword,
            newPassword,
          },
        })
        .execute();
    } else return redirect(request, "error", target);

    return redirect(request, "saved", target);
  } catch (error) {
    console.error("Failed to update customer account:", error);
    return redirect(request, "error", target);
  }
}
