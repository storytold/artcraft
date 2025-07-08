
#[derive(Clone, Copy, Debug, Hash, PartialEq, Eq, PartialOrd, Ord)]
pub enum TaskState {
  Submitted,
  InProgress,
  
  // Terminal states
  
  Complete,
  Failed,
}