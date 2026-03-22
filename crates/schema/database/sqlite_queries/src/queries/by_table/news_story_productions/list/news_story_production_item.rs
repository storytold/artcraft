use enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus;
use enums_db::common::sqlite::web_content_type::WebContentType;
use tokens::tokens::news_stories::NewsStoryToken;

pub struct NewsStoryProductionItem {
  pub id: i64,
  pub news_story_token: NewsStoryToken,
  pub web_content_type: WebContentType,
  pub original_news_canonical_url: String,
  pub original_news_title: String,

  pub maybe_summary_news_title: Option<String>,
  pub maybe_categorization: Option<String>,

  // Overall production status, which depends on all other statuses
  pub overall_production_status: AwaitableJobStatus,

  // LLM main text rendition task
  pub llm_rendition_status: AwaitableJobStatus,
  pub llm_rendition_attempts: i64,

  // LLM title summary task
  pub llm_title_summary_status: AwaitableJobStatus,
  pub llm_title_summary_attempts: i64,

  // LLM categorization task
  pub llm_categorization_status: AwaitableJobStatus,
  pub llm_categorization_attempts: i64,

  // Audio generation tasks (farmed out to 1:n work items)
  pub audio_generation_status: AwaitableJobStatus,

  // Image generation task
  pub image_generation_status: AwaitableJobStatus,
  pub image_generation_attempts: i64,
}
