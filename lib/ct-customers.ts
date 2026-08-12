import {apiRoot, executeRequest} from '@/lib/ct-client';
import { cookies } from 'next/headers';

export async function getCurrentCustomer() {
  const customerId = cookies().get('commerce_customer_id')?.value;
  if (!customerId) {
    return null;
  }

  try {
    const uri = apiRoot
      .customers
      .parse({
        id: customerId
      })
      .build();
    const result = await executeRequest({
      method: 'GET',
      uri: uri
    });
    console.log(uri)
    return result.body;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}
