import { getCurrentCustomer } from '@/lib/ct-customers';

export default async function AccountPage() {
  const customer = await getCurrentCustomer();

  return (
    <div>
      <div className="brand-bar">
        <div>
          <h1 className="section-title">My Account</h1>
          <p>Manage your customer profile and orders.</p>
        </div>
      </div>

      {customer ? (
        <div className="account-card">
          <h2>Account details</h2>
          <p>Name: {customer.firstName} {customer.lastName}</p>
          <p>Email: {customer.email}</p>
          <p>Customer ID: {customer.id}</p>
          <form method="post" action="/api/auth/logout" style={{ marginTop: '16px' }}>
            <button className="button-secondary" type="submit">Logout</button>
          </form>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: '24px' }}>
          <div className="auth-card">
            <h2>Login</h2>
            <form method="post" action="/api/auth/login" className="form-group">
              <label htmlFor="email">Email</label>
              <input className="input" id="email" name="email" type="email" required />
              <label htmlFor="password">Password</label>
              <input className="input" id="password" name="password" type="password" required />
              <button className="button" type="submit" style={{ marginTop: '16px' }}>Login</button>
            </form>
          </div>

          <div className="auth-card">
            <h2>Create account</h2>
            <form method="post" action="/api/auth/register" className="form-group">
              <label htmlFor="firstName">First name</label>
              <input className="input" id="firstName" name="firstName" type="text" required />
              <label htmlFor="lastName">Last name</label>
              <input className="input" id="lastName" name="lastName" type="text" required />
              <label htmlFor="emailRegister">Email</label>
              <input className="input" id="emailRegister" name="email" type="email" required />
              <label htmlFor="passwordRegister">Password</label>
              <input className="input" id="passwordRegister" name="password" type="password" required />
              <button className="button" type="submit" style={{ marginTop: '16px' }}>Register</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
