
import { useTranslation as useUiTranslation } from "@storyteller/i18n";
import { ImageTo3DExperience } from "../../components/experiences/ImageTo3DExperience";

export const ImageTo3DObject = () => {
  const { t: translateUi } = useUiTranslation();
  return (
    <ImageTo3DExperience
      title={translateUi("Generate 3D Object")}
      subtitle="Transform your image into a 3D object with textures."
      variant="object"
    />
  );
};

export default ImageTo3DObject;

