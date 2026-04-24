import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.brand}>LockerVan</h1>
        <p className={styles.tagline}>
          Scan the QR code on your locker to get started.
        </p>
      </main>
    </div>
  );
}
