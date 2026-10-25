
import { useTranslation as useUiTranslation } from "@storyteller/i18n";
import {
  Button
} from "@storyteller/ui-button"

interface Props {
  title: string;
  onOk: () => void;
}

export const UploadSuccess = ({ title, onOk }: Props) => {
  const { t: translateUi } = useUiTranslation();
  return (
    <>
      <div className="w-100 text-center opacity-50">{`Added ${title} to your library`}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onOk} variant="primary">
          {translateUi("Ok")}</Button>
      </div>
    </>
  );
};
