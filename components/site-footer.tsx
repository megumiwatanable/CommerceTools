"use client";

import { useState, useEffect } from 'react';

export default function SiteFooter() {
  const [country, setCountry] = useState('US');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(^|;)\s*commerce_country=([^;]+)/);
      const legacyCountryCodes: Record<string, string> = { 'en-US': 'US', 'en-GB': 'GB', 'de-DE': 'DE' };
      const rawCountry = match ? decodeURIComponent(match[2]) : '';
      const savedCountry = (legacyCountryCodes[rawCountry] ?? rawCountry) || 'US';
      setCountry(savedCountry);

      if (!match || legacyCountryCodes[rawCountry]) {
        document.cookie = `commerce_country=${savedCountry}; path=/; max-age=${60 * 60 * 24 * 365}`;
      }
    }
  }, []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setCountry(v);

    // Set cookie
    document.cookie = `commerce_country=${v}; path=/; max-age=${60 * 60 * 24 * 365}`;

    // Reload page
    window.location.href = window.location.pathname + window.location.search;
  }

  return (
    <footer className="site-footer">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#6b7280' }}>© {new Date().getFullYear()} CommerceApp. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ color: '#6b7280', fontWeight: 600 }}>Country</label>
          <select value={country} onChange={onChange} className="select">
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="DE">Germany</option>
          </select>
        </div>
      </div>
    </footer>
  );
}
