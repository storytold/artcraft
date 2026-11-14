
import { useTranslation as useUiTranslation } from "@storyteller/i18n";
import { FilterEngineCategories } from "@storyteller/api";
import { Button } from "@storyteller/ui-button";
interface Props {
  onCancel: () => void;
  onRetry: () => void;
  type: FilterEngineCategories | string;
  errorMessage?: string;
}

export const UploadAssetError = ({
  onCancel,
  onRetry,
  type,
  errorMessage,
}: Props) => {
  const { t: translateUi } = useUiTranslation();
  return (
    <>
      <h3>{translateUi("Error in Uploading")}{" "}{type}</h3>
      <p>{errorMessage ?? "Unknown Error"}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary">
          {translateUi("Cancel")}</Button>
        <Button onClick={onRetry} variant="primary">
          {translateUi("Try again")}</Button>
      </div>
    </>
  );
};
