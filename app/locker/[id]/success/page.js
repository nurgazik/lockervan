"use client";

import { use, useState, useEffect } from "react";
import styles from "./page.module.css";

export default function SuccessPage({ params, searchParams }) {
  const { id } = use(params);
  const { session_id } = use(searchParams);
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!session_id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15;

    async function poll() {
      try {
        const res = await fetch(`/api/rental-status?session_id=${session_id}`);
        const data = await res.json();

        if (cancelled) return;

        if (data.rental?.netcode) {
          setRental(data.rental);
          setLoading(false);
          setPolling(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          setLoading(false);
          setPolling(true);
          setTimeout(poll, 2000);
        } else {
          setLoading(false);
          setPolling(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setPolling(false);
        }
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [session_id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.loading}>Loading your rental details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.brand}>LockerVan</h1>
          <div className={styles.lockerId}>Locker #{id}</div>
        </div>

        <div className={styles.confirmation}>
          <p className={styles.checkmark}>&#10003;</p>
          <h2 className={styles.title}>Payment Confirmed</h2>
        </div>

        {rental?.netcode ? (
          <div className={styles.pinSection}>
            <p className={styles.pinLabel}>Your Locker Code</p>
            <p className={styles.pin}>{rental.netcode}</p>
            <div className={styles.times}>
              <div className={styles.timeRow}>
                <span className={styles.timeLabel}>Start</span>
                <span className={styles.timeValue}>
                  {new Date(rental.rental_start).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <div className={styles.timeRow}>
                <span className={styles.timeLabel}>Expires</span>
                <span className={styles.timeValue}>
                  {new Date(rental.rental_expiry).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ) : polling ? (
          <div className={styles.pending}>
            <p>Your code is being generated...</p>
          </div>
        ) : (
          <div className={styles.pending}>
            <p>Your code will be sent to your phone via text message.</p>
          </div>
        )}

        <p className={styles.smsNote}>
          Your code usually arrives via text within 30 seconds.
        </p>
      </div>
    </div>
  );
}
