import Link from "next/link";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <div className="account-page">
      <section className="page-heading">
        <p className="eyebrow">Account recovery</p>
        <h1>Choose a new password</h1>
      </section>
      <section className="panel auth-card">
        {searchParams.token ? (
          <form method="post" action="/api/auth/reset-password" className="form-group">
            <input type="hidden" name="token" value={searchParams.token} />
            <label htmlFor="newPassword">New password</label>
            <input className="input" id="newPassword" name="password" type="password" minLength={8} autoComplete="new-password" required />
            <label htmlFor="confirmPassword">Confirm password</label>
            <input className="input" id="confirmPassword" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required />
            <button className="button" type="submit">Update password</button>
          </form>
        ) : (
          <Link href="/account/forgot-password" className="button">Request a new link</Link>
        )}
      </section>
    </div>
  );
}
