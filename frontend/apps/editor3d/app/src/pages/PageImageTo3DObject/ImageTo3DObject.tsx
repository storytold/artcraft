import { ImageTo3DExperience } from "../../components/experiences/ImageTo3DExperience";

export const ImageTo3DObject = () => {
  return (
    <ImageTo3DExperience
      title="Generate 3D Object"
      subtitle="Transform your image into a 3D object with textures."
      variant="object"
      backgroundImage="/resources/images/floating-cubes.png"
    />
  );
};

export default ImageTo3DObject;

