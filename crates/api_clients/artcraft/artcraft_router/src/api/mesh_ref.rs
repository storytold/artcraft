use tokens::tokens::media_files::MediaFileToken;

/// Reference to an input 3D mesh file (e.g. GLB/OBJ/FBX) for mesh-to-mesh
/// models like part splitting and retopology.
#[derive(Clone, Debug)]
pub enum MeshRef {
  MediaFileToken(MediaFileToken),
  Url(String),
}
