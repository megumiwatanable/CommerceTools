import AccountGuest from "@/components/account-guest";
import AccountShell from "@/components/account-shell";
import { getCurrentCustomer } from "@/lib/ct-customers";

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) return <AccountGuest />;
  return (
    <div className="account-page">
      <section className="page-heading">
        <p className="eyebrow">Account settings</p>
        <h1>Profile & security</h1>
        <p>Manage your personal details and password.</p>
      </section>
      <AccountShell customer={customer} active="profile">
        <section className="panel account-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Personal details</p>
              <h2>Profile</h2>
            </div>
          </div>
          <form method="post" action="/api/account" className="form-grid">
            <input type="hidden" name="action" value="profile" />
            <div className="form-group">
              <label htmlFor="firstName">First name</label>
              <input
                className="input"
                id="firstName"
                name="firstName"
                defaultValue={customer.firstName}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last name</label>
              <input
                className="input"
                id="lastName"
                name="lastName"
                defaultValue={customer.lastName}
                required
              />
            </div>
            <div className="form-group form-span-2">
              <label htmlFor="email">Email address</label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                defaultValue={customer.email}
                required
              />
            </div>
            <div>
              <button className="button" type="submit">
                Save changes
              </button>
            </div>
          </form>
        </section>
        <section className="panel account-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Account protection</p>
              <h2>Change password</h2>
            </div>
          </div>
          <form method="post" action="/api/account" className="form-grid">
            <input type="hidden" name="action" value="password" />
            <div className="form-group form-span-2">
              <label htmlFor="currentPassword">Current password</label>
              <input
                className="input"
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New password</label>
              <input
                className="input"
                id="newPassword"
                name="newPassword"
                type="password"
                minLength={8}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                className="input"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={8}
                required
              />
            </div>
            <div>
              <button className="button" type="submit">
                Update password
              </button>
            </div>
          </form>
        </section>
      </AccountShell>
    </div>
  );
}
