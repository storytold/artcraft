// One tutorial video as listed in the Help window.
export type TutorialItem = {
  // Short unique name, also the key under which the watch position is saved.
  id: string;
  // Title shown under the thumbnail and above the video.
  title: string;
  // Address of the thumbnail picture. The built-in ones start with "/resources/..." and are files shipped inside the app.
  thumbnailUrl: string;
  // The YouTube address of the video (help-menu.tsx pulls the video id out of it).
  videoUrl: string;
  // Optional group name (see TutorialCategory).
  category?: string;
};

// The groups a tutorial can belong to. The text is the label a person would read.
export enum TutorialCategory {
  // Tutorials about the 3D stage.
  Editor3D = "3D Stage",
  // Tutorials about the 2D image editor.
  Canvas2D = "Image Editor",
}

// The three tutorials that ship with the app. A caller can replace this list through HelpMenuButton's `items` prop.
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
    title: "Image Editor Basics",
    thumbnailUrl: "/resources/images/tutorial-thumbnails/2D_Editor_Basics.jpg",
    videoUrl: "https://youtu.be/ZASPqlqUBQc?si=U9yRn6KETNJKaUAo",
    category: TutorialCategory.Canvas2D,
  },
  {
    id: "3d-editor-posing",
    title: "3D Stage & Posing",
    thumbnailUrl: "/resources/images/tutorial-thumbnails/3D_Editor_Basics.jpg",
    videoUrl: "https://youtu.be/pM4CxN-isrY?si=XDyG5C1aMIL4KK5O",
    category: TutorialCategory.Editor3D,
  },
];
