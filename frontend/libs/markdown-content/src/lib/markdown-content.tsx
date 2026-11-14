
import { useTranslation as useUiTranslation } from "@storyteller/i18n";

import styles from './markdown-content.module.css';

export function StorytellerMarkdownContent() {
  const { t: translateUi } = useUiTranslation();
  return (
    <div className={styles['container']}>
      <h1>{translateUi("Welcome to StorytellerMarkdownContent!")}</h1>
    </div>
  );
}

export default StorytellerMarkdownContent;



