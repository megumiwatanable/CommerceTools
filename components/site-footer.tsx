"use client";

import { useState, useEffect } from 'react';

export default function SiteFooter() {
  const [country, setCountry] = useState('en-US');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(^|;)\s*commerce_country=([^;]+)/);
      const savedCountry = match ? decodeURIComponent(match[2]) : 'en-US';
      setCountry(savedCountry);

      if (!match) {
        document.cookie = `commerce_country=en-US; path=/; max-age=${60 * 60 * 24 * 365}`;
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
            <option value="en-US">United States</option>
            <option value="en-GB">United Kingdom</option>
            <option value="de-DE">Germany</option>
          </select>
        </div>
      </div>
    </footer>
  );
}