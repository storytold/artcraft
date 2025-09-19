export interface Prompts {
    created_at: string;
    lcm_disabled: boolean;
    lipsync_enabled: boolean;
    maybe_inference_duration_millis: number;
    maybe_moderator_fields: string;
    maybe_negative_prompt: string;
    maybe_positive_prompt: string;
    maybe_strength: number;
    maybe_style_name: string;
    prompt_type: string;
    token: string;
    use_cinematic: boolean;
    used_face_detailer: boolean;
    used_upscaler: boolean;
    maybe_model_type: string;
    maybe_generation_provider: string;
    maybe_context_images: [
        {
            media_links: {
                cdn_url: string;
                maybe_thumbnail_template: string;
                maybe_video_previews: {
                    animated: string;
                    animated_thumbnail_template: string;
                    still: string;
                    still_thumbnail_template: string;
                };
            };
            media_token: string;
            semantic: string;
        }
    ];
}
//# sourceMappingURL=Prompts.d.ts.map