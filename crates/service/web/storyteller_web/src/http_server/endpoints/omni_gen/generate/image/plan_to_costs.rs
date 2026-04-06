use artcraft_router::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;

/// Extract the cost estimate from an image generation plan.
pub fn plan_to_costs(plan: &ImageGenerationPlan<'_>) -> ImageGenerationCostEstimate {
  plan.estimate_costs()
}
