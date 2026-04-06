use artcraft_router::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;

/// Extract the cost estimate from a video generation plan.
pub fn plan_to_costs(plan: &VideoGenerationPlan<'_>) -> VideoGenerationCostEstimate {
  plan.estimate_costs()
}
