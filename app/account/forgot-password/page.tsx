import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="account-page">
      <section className="page-heading">
        <p className="eyebrow">Account recovery</p>
        <h1>Reset your password</h1>
        <p>Enter your account email and we’ll send a reset link.</p>
      </section>
      <section className="panel auth-card">
        <form method="post" action="/api/auth/forgot-password" className="form-group">
          <label htmlFor="resetEmail">Email</label>
          <input
            className="input"
            id="resetEmail"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <button className="button" type="submit">Send reset link</button>
          <Link href="/account" className="text-button">Back to sign in</Link>
        </form>
      </section>
    </div>
  );
}
