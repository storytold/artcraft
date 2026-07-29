use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use rand::Rng;

use mysql_queries::queries::generic_inference::api_providers::seedance2pro::list_pending_seedance2pro_video_jobs::PendingSeedance2ProJob;
use seedance2pro_client::requests::poll_orders::poll_orders::OrderStatus;

/// Kinovi's `order_id`. Used as the key into the reconciler.
pub type OrderId = String;

/// A finished external order (Kinovi reports it `Completed` or `Failed`) paired
/// with our database job record, staged for reconciliation into our own system.
#[derive(Clone)]
pub struct OrderDetails {
  /// The order payload fetched from Kinovi (success or failure details).
  pub kinovi_record: OrderStatus,
  /// Our database job that this order fulfills.
  pub database_record: PendingSeedance2ProJob,
}

/// Hand-off point between the polling loop and the processing loop.
///
/// Metaphor: reconciliation. Kinovi is an external ledger of orders; once an
/// order is *finished* there (success or failure), our system still has to be
/// brought into agreement — download/upload the result, write the media file,
/// settle the job row, refund on failure. The polling loop discovers finished
/// orders and stages them here; the processing loop drains them and reconciles
/// each one into our database.
///
/// Cheaply [`Clone`]able: clones share the same underlying map.
#[derive(Clone)]
pub struct OrderReconciler {
  // NB: A std (sync) RwLock is intentional. All critical sections are tiny,
  // in-memory map operations with no `.await` held across the guard, so there
  // is no risk of blocking the async runtime.
  inner: Arc<RwLock<HashMap<OrderId, OrderDetails>>>,
}

impl OrderReconciler {
  pub fn new() -> Self {
    Self {
      inner: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  /// Stage a finished order for reconciliation, but only if it isn't already
  /// staged. Returns `true` if it was newly inserted, `false` if an entry for
  /// this `order_id` was already present (so the poller doesn't re-enqueue an
  /// order the processor is mid-way through, or one it already staged).
  pub fn push_order(
    &self,
    order_id: OrderId,
    kinovi_order: OrderStatus,
    database_record: PendingSeedance2ProJob,
  ) -> bool {
    let mut map = self.inner.write().expect("order reconciler lock poisoned");

    if map.contains_key(&order_id) {
      return false;
    }

    map.insert(order_id, OrderDetails { kinovi_record: kinovi_order, database_record });
    true
  }

  /// Clone out one *randomly chosen* staged order without removing it, so the
  /// caller can consult the database before committing to (and popping) it.
  /// Returns `None` when nothing is staged.
  ///
  /// Selection is random on purpose: if we always handed back the same
  /// (deterministically ordered) entry, a single order that keeps failing to
  /// process — and keeps getting re-staged by the poller — could monopolize the
  /// consumer and starve everything behind it. Random pick spreads attempts
  /// across the whole backlog so one poison order can't wedge the queue.
  pub fn peek_random(&self) -> Option<OrderDetails> {
    let map = self.inner.read().expect("order reconciler lock poisoned");

    if map.is_empty() {
      return None;
    }

    let index = rand::rng().random_range(0..map.len());
    map.values().nth(index).cloned()
  }

  /// Remove and return a staged order by id.
  pub fn remove(&self, order_id: &str) -> Option<OrderDetails> {
    let mut map = self.inner.write().expect("order reconciler lock poisoned");
    map.remove(order_id)
  }

  pub fn contains(&self, order_id: &str) -> bool {
    let map = self.inner.read().expect("order reconciler lock poisoned");
    map.contains_key(order_id)
  }

  pub fn len(&self) -> usize {
    let map = self.inner.read().expect("order reconciler lock poisoned");
    map.len()
  }

  pub fn is_empty(&self) -> bool {
    self.len() == 0
  }
}

impl Default for OrderReconciler {
  fn default() -> Self {
    Self::new()
  }
}
