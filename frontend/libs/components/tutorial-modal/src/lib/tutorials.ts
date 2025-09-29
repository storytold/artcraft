export type TutorialItem = {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  category?: string;
};

export enum TutorialCategory {
  Editor3D = "3D Editor",
  Canvas2D = "2D Canvas",
}

export const defaultTutorials: TutorialItem[] = [
  {
    id: "turn-images-into-objects",
    title: "Turn Images into 3D Objects",
    thumbnailUrl:
      "/resources/images/tutorial-thumbnails/Turn_Images_Into_Objects.jpg",
    videoUrl: "https://youtu.be/t8F-sy_zyK4?si=P8lSzuiwSgdRttKa",
    category: TutorialCategory.Editor3D,
  },
  {
    id: "2d-editor-basics",
    title: "2D Editor Basics",
    thumbnailUrl: "/resources/images/tutorial-thumbnails/2D_Editor_Basics.jpg",
    videoUrl: "https://youtu.be/ZASPqlqUBQc?si=U9yRn6KETNJKaUAo",
    category: TutorialCategory.Canvas2D,
  },
  {
    id: "3d-editor-posing",
    title: "3D Editor & Posing",
    thumbnailUrl: "/resources/images/tutorial-thumbnails/3D_Editor_Basics.jpg",
    videoUrl: "https://youtu.be/pM4CxN-isrY?si=XDyG5C1aMIL4KK5O",
    category: TutorialCategory.Editor3D,
  },
];
