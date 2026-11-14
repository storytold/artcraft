
import { useTranslation as useUiTranslation } from "@storyteller/i18n";
import { ImageTo3DExperience } from "../../components/experiences/ImageTo3DExperience";

export const ImageTo3DWorld = () => {
  const { t: translateUi } = useUiTranslation();
  return (
    <ImageTo3DExperience
      title={translateUi("Image to 3D World")}
      subtitle="Generate 3D worlds from an image with World Labs"
      variant="world"
    />
  );
};

export default ImageTo3DWorld;
