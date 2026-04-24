"use client";

import { use, useState } from "react";
import styles from "./page.module.css";

const DURATION_OPTIONS = [
  { hours: 3, label: "3 Hours", price: 300, display: "$3" },
];

export default function LockerPage({ params }) {
  const { id } = use(params);
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePhoneChange(e) {
    const value = e.target.value.replace(/[^\d+\-() ]/g, "");
    setPhone(value);
    if (error) setError("");
  }

  async function handleCheckout() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (selected === null) {
      setError("Please select a rental duration.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const option = DURATION_OPTIONS[selected];
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lockerId: id,
          phone,
          durationHours: option.hours,
          priceInCents: option.price,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const isReady = phone.replace(/\D/g, "").length >= 10 && selected !== null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.brand}>LockerVan</h1>
          <div className={styles.lockerId}>Locker #{id}</div>
        </div>

        <div className={styles.section}>
          <label className={styles.label} htmlFor="phone">
            Phone Number
          </label>
          <p className={styles.hint}>Your locker code will be sent via text.</p>
          <input
            id="phone"
            type="tel"
            className={styles.phoneInput}
            placeholder="+1 (250) 555-0123"
            value={phone}
            onChange={handlePhoneChange}
            autoComplete="tel"
          />
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Rental Duration</label>
          <div className={styles.options}>
            {DURATION_OPTIONS.map((option, i) => (
              <button
                key={option.hours}
                className={`${styles.option} ${selected === i ? styles.optionSelected : ""}`}
                onClick={() => {
                  setSelected(i);
                  if (error) setError("");
                }}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionPrice}>{option.display}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.checkout}
          onClick={handleCheckout}
          disabled={!isReady || loading}
        >
          {loading ? "Redirecting..." : "Continue to Payment"}
        </button>

        <p className={styles.footer}>
          Your rental starts the moment you pay.
        </p>
      </div>
    </div>
  );
}
