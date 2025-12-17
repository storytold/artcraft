import { ImageTo3DExperience } from "../../components/experiences/ImageTo3DExperience";

export const ImageTo3DWorld = () => {
  return (
    <ImageTo3DExperience
      title="Image to 3D World"
      subtitle="Generate 3D worlds from an image with World Labs"
      variant="world"
      backgroundImage="/resources/images/room-of-items.png"
    />
  );
};

export default ImageTo3DWorld;
