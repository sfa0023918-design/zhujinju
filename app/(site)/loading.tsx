import styles from "./loading.module.css";

export default function SiteLoading() {
  return (
    <div className={styles.loadingShell} role="status" aria-live="polite">
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressBar} />
      </div>
      <p className={styles.loadingText}>
        <span>页面加载中</span>
        <span lang="en" className={styles.loadingTextEn}>
          Loading
        </span>
      </p>
    </div>
  );
}
