pub (super) const R2_BUCKET_URL : &str = "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/";

// TODO(bt,2025-03-13): Try to use keyword args from the call site.
// NB: We're using a macro because we can't use a builder pattern and then concat string literals
//  and variables (even if they're known to be &'static) and keep allocations static.
macro_rules! weight {
    ($name: literal, $file_name:literal, $weight_function:expr) => {
      $crate::weights_registry::weight_descriptor::WeightDescriptor {
        name: $name,
        filename: $file_name,
        r2_download_url: const_format::concatcp!(crate::weights_registry::weight_descriptor_builder::R2_BUCKET_URL, $file_name),
        function: $weight_function,
      }
    };
}

pub(crate) use weight;
