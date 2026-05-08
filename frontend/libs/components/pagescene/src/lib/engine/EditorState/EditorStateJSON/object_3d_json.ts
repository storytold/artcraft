export interface Object3DJSON {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
  object_name: string;
  object_uuid: string;
  object_user_data_name: string;
  media_file_token: string;
  color: string;
  metalness: number;
  shininess: number;
  specular: number;
  locked: boolean;
  visible: boolean | undefined;
}
