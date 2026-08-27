export default function AccountGuest({ error = false }: { error?: boolean }) {
  return (
    <div className="account-page">
      <section className="page-heading">
        <p className="eyebrow">Welcome</p>
        <h1>Sign in to your account</h1>
        <p>Access orders, saved delivery details, and a faster checkout.</p>
      </section>
      {error && (
        <p className="notice notice-error">
          We couldn’t sign you in or create your account. Please try again.
        </p>
      )}
      <div className="auth-layout">
        <section className="auth-card">
          <p className="eyebrow">Returning customer</p>
          <h2>Welcome back</h2>
          <form method="post" action="/api/auth/login" className="form-group">
            <label htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <button className="button" type="submit">
              Sign in
            </button>
            <a className="text-button" href="/account/forgot-password">
              Forgot password?
            </a>
          </form>
        </section>
        <section className="auth-card auth-card-accent">
          <p className="eyebrow">New here?</p>
          <h2>Create an account</h2>
          <form method="post" action="/api/auth/register" className="form-grid">
            <div className="form-group">
              <label htmlFor="registerFirstName">First name</label>
              <input
                className="input"
                id="registerFirstName"
                name="firstName"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="registerLastName">Last name</label>
              <input
                className="input"
                id="registerLastName"
                name="lastName"
                required
              />
            </div>
            <div className="form-group form-span-2">
              <label htmlFor="emailRegister">Email</label>
              <input
                className="input"
                id="emailRegister"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group form-span-2">
              <label htmlFor="passwordRegister">Password</label>
              <input
                className="input"
                id="passwordRegister"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <button className="button" type="submit">
                Create account
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
