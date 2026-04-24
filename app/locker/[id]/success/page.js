"use client";

import { use, useState, useEffect } from "react";
import styles from "./page.module.css";

export default function SuccessPage({ params, searchParams }) {
  const { id } = use(params);
  const { session_id } = use(searchParams);
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session_id) {
      setLoading(false);
      return;
    }

    fetch(`/api/rental-status?session_id=${session_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rental) setRental(data.rental);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
        ) : (
          <div className={styles.pending}>
            <p>Your code is being generated and will be sent to your phone via text message.</p>
          </div>
        )}

        <p className={styles.smsNote}>
          Your code usually arrives via text within 30 seconds.
        </p>
      </div>
    </div>
  );
}
