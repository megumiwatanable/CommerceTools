import { createRequestBuilder } from '@commercetools/api-request-builder';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createLoggerMiddleware } from '@commercetools/sdk-middleware-logger';
import { createClient } from '@commercetools/sdk-client';

const projectKey = process.env.NEXT_PUBLIC_CT_PROJECT_KEY;
const apiUrl = process.env.NEXT_PUBLIC_CT_API_URL;
const authUrl = process.env.NEXT_PUBLIC_CT_AUTH_URL;
const clientId = process.env.CT_CLIENT_ID;
const clientSecret = process.env.CT_CLIENT_SECRET;

if (!projectKey || !apiUrl || !authUrl || !clientId || !clientSecret) {
  throw new Error('Missing commercetools environment variables');
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function fetchAccessToken() {
  const response = await fetch(`${authUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: `manage_project:${projectKey}`,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch commercetools access token: ${response.status} ${response.statusText}`);
  }

  const tokenData = await response.json();
  cachedToken = tokenData.access_token;
  tokenExpiresAt = Date.now() + tokenData.expires_in * 1000 - 10_000;
  return cachedToken;
}

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  return fetchAccessToken();
}

const authMiddleware = (next: any) => async (request: any, response: any) => {
  const accessToken = await getAccessToken();
  request.headers = {
    ...(request.headers || {}),
    Authorization: `Bearer ${accessToken}`,
  };

  return next(request, response);
};

const httpMiddleware = createHttpMiddleware({
  host: apiUrl,
});

const loggerMiddleware = createLoggerMiddleware({
  logBody: false,
});

const client = createClient({
  middlewares: [authMiddleware, httpMiddleware, loggerMiddleware],
});

export const apiRoot = createRequestBuilder({ projectKey });
export const productProjectionService = apiRoot.productProjections;
export const cartService = apiRoot.carts;
export const orderService = apiRoot.orders;
export const customerService = apiRoot.customers;

export async function executeRequest(request: {
  method: string;
  uri: string;
  body?: unknown;
  headers?: Record<string, string>;
}) {
  return client.execute(request);
}
