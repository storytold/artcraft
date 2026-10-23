import { Trans, useTranslation } from "@storyteller/i18n";
import { CheckIcon } from "lucide-react";
import styles from "./LoginSuccess.module.css";

export function LoginSuccess({ username }: { username: string }) {
  const { t } = useTranslation();
  return (
    <div className={styles.panel} role="status" aria-live="polite" aria-atomic="true">
      <div className={styles.badge} aria-hidden="true">
        <CheckIcon size={28} strokeWidth={2} />
      </div>
      <h2 className={styles.heading}>
        <Trans t={t} i18nKey="Logged in as <username>{{username}}</username>" values={{ username }} components={{ username: <span className={styles.username} /> }} />
      </h2>
      <p className={styles.caption}>{t("You're ready to create.")}</p>
    </div>
  );
}
