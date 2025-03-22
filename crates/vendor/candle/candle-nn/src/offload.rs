use candle::{Device, Result};

pub trait DeviceTransferable {
    /// Move the module to the specified device
    ///
    /// # Arguments
    ///
    /// * `device` - The target device to move the module to
    ///
    /// # Returns
    ///
    /// A new instance of the module with all tensors moved to the target device,
    /// or an error if the module cannot be moved.
    fn to_device(&self, _device: &Device) -> Result<Self> where Self: Sized {
        // Default implementation that rejects moving - components can override this
        candle::bail!("to_device not implemented for this type")
    }
}
