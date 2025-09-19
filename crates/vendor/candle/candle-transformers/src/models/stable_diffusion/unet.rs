impl UNet2DConditionModel {
    pub fn load_with_weights(
        config: UNet2DConfig,
        weights: std::collections::HashMap<String, Tensor>,
        device: &Device,
        use_flash_attn: bool,
        dtype: DType,
    ) -> Result<Self> {
        let mut unet = Self::new(&config, use_flash_attn)?;
        unet.load_tensors_from_hash(weights, device, dtype)?;
        Ok(unet)
    }

    fn load_tensors_from_hash(
        &mut self,
        mut weights: std::collections::HashMap<String, Tensor>,
        device: &Device,
        dtype: DType,
    ) -> Result<()> {
        // Load the weights from the HashMap into the model
        for (name, tensor) in weights.drain() {
            let tensor = tensor.to_device(device)?.to_dtype(dtype)?;
            self.load_tensor(&name, tensor)?;
        }
        Ok(())
    }
} 