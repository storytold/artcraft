
#[derive(Clone, Copy, Debug, Hash, PartialEq, Eq, PartialOrd, Ord)]
pub enum TaskType {
  BackgroundRemoval,
  ImageGeneration,
  VideoGeneration,
}