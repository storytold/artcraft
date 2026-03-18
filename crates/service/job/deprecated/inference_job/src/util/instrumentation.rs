use std::time::Duration;

use log::{info, warn};
use opentelemetry::KeyValue;
use opentelemetry::metrics::{Counter, Histogram, Meter, Unit};
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::metrics::reader::{DefaultAggregationSelector, DefaultTemporalitySelector};
use opentelemetry_sdk::Resource;

pub struct JobInstrumentLabels {
    pub service_name: String,
    pub service_namespace: String,
    pub service_version: String,
    pub service_instance_id: String,
    pub service_job_scope: String,
}

// TODO(kasisnu, 12/02/24): move this into a config struct/better type once more binaries are instrumented
pub fn init_otel_metrics_pipeline(
    job_instrument_labels: JobInstrumentLabels,
) -> Result<(), opentelemetry::metrics::MetricsError>  {
    info!("Setting up otel metrics pipeline...");

    // check env var to see if we should skip telemetry
    if std::env::var("SKIP_TELEMETRY").is_ok() {
        warn!("Skipping telemetry setup due to SKIP_TELEMETRY env var");
        return Ok(());
    }
    let provider = opentelemetry_otlp::new_pipeline()
        .metrics(opentelemetry_sdk::runtime::Tokio)
        // TODO: 1. read host from env 2. Single pod of otel-collector is probably not good enough, run daemonset?
        .with_exporter(opentelemetry_otlp::new_exporter().tonic().with_endpoint("http://adot-collector.adot-collector-kubeprometheus:4317"))
        .with_resource(Resource::new(vec![
            KeyValue::new("service.name", job_instrument_labels.service_name),
            KeyValue::new("service.namespace", job_instrument_labels.service_namespace),
            KeyValue::new("service.version", job_instrument_labels.service_version),
            KeyValue::new("service.instance.id", job_instrument_labels.service_instance_id),
            KeyValue::new("service.job.scope", job_instrument_labels.service_job_scope),
        ]))
        .with_period(Duration::from_secs(3))
        .with_timeout(Duration::from_secs(10))
        .with_aggregation_selector(DefaultAggregationSelector::new())
        .with_temporality_selector(DefaultTemporalitySelector::new())
        .build()?;

    opentelemetry::global::set_meter_provider(provider);

    match opentelemetry::global::set_error_handler(|error| {
        warn!("OpenTelemetry error: {}", error);
    }) {
        err => {
            warn!("Failed to set OpenTelemetry error handler: {:?}", err);
        }
    };

    Ok(())
}

pub struct JobInstruments {
    pub job_duration: Histogram<u64>,
    pub inference_command_execution_duration: Histogram<u64>,
    pub batch_query_duration: Histogram<u64>,
    pub batch_size: Histogram<u64>,
    pub batch_processing_duration: Histogram<u64>,
    pub total_job_count: Counter<u64>,
    pub job_success_count: Counter<u64>,
    pub job_failure_count: Counter<u64>,
}

impl JobInstruments {
    pub fn new_from_meter(meter: Meter) -> Self {
        let job_duration = meter.u64_histogram("inference_job_duration")
            .with_unit(Unit::new("milliseconds"))
            // job type could be a label, and this instrument could be common for all jobs
            .with_description("inference job duration")
            .init();

        let batch_query_duration = meter.u64_histogram("inference_job_batch_query_duration")
            .with_unit(Unit::new("milliseconds"))
            .with_description("inference job batch query duration")
            .init();

        let batch_size = meter.u64_histogram("inference_job_batch_size")
            .with_unit(Unit::new("jobs"))
            .with_description("inference job batch size")
            .init();

        let inference_command_execution_duration = meter.u64_histogram("inference_job_inference_command_execution_duration")
            .with_unit(Unit::new("milliseconds"))
            .with_description("inference job inference command execution duration")
            .init();

        let batch_processing_duration = meter.u64_histogram("inference_job_batch_processing_duration")
            .with_unit(Unit::new("milliseconds"))
            .with_description("inference job batch processing duration")
            .init();

        let total_job_count = meter.u64_counter("inference_job_total_job_count")
            .with_unit(Unit::new("jobs"))
            .with_description("inference job total job count")
            .init();

        let job_success_count = meter.u64_counter("inference_job_success_count")
            .with_unit(Unit::new("jobs"))
            .with_description("inference job success count")
            .init();

        let job_failure_count = meter.u64_counter("inference_job_failure_count")
            .with_unit(Unit::new("jobs"))
            .with_description("inference job failure count")
            .init();

        Self {
            job_duration,
            inference_command_execution_duration,
            batch_query_duration,
            batch_size,
            batch_processing_duration,
            total_job_count,
            job_success_count,
            job_failure_count,
        }
    }
}