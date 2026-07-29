// Dropdown options for the report form. Values mirror the backend enums
// (`UploadedVideoNoteReportedModelType`, `UploadedVideoNoteReportedWebsite`).

export const CUSTOM_VALUE = '__custom__';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export const MODEL_TYPE_GROUPS: SelectGroup[] = [
  {
    label: 'Seedance',
    options: [
      { value: 'seedance_1p0_lite', label: 'Seedance 1.0 Lite' },
      { value: 'seedance_1p5_pro', label: 'Seedance 1.5 Pro' },
      { value: 'seedance_2p0', label: 'Seedance 2.0' },
      { value: 'seedance_2p0_fast', label: 'Seedance 2.0 Fast' },
      { value: 'seedance_2p0_bp', label: 'Seedance 2.0 (BytePlus)' },
      { value: 'seedance_2p0_bp_fast', label: 'Seedance 2.0 Fast (BytePlus)' },
      { value: 'seedance_2p0_u', label: 'Seedance 2.0 Ultra' },
      { value: 'seedance_2p0_u_fast', label: 'Seedance 2.0 Ultra Fast' },
      { value: 'seedance_2p0_bpu', label: 'Seedance 2.0 Ultra (BytePlus)' },
      { value: 'seedance_2p0_bpu_fast', label: 'Seedance 2.0 Ultra Fast (BytePlus)' },
    ],
  },
  {
    label: 'Veo',
    options: [
      { value: 'veo_2', label: 'Veo 2' },
      { value: 'veo_3', label: 'Veo 3' },
      { value: 'veo_3_fast', label: 'Veo 3 Fast' },
      { value: 'veo_3p1', label: 'Veo 3.1' },
      { value: 'veo_3p1_fast', label: 'Veo 3.1 Fast' },
    ],
  },
  {
    label: 'Sora',
    options: [
      { value: 'sora_2', label: 'Sora 2' },
      { value: 'sora_2_pro', label: 'Sora 2 Pro' },
    ],
  },
  {
    label: 'Kling',
    options: [
      { value: 'kling_1p6_pro', label: 'Kling 1.6 Pro' },
      { value: 'kling_2p1_pro', label: 'Kling 2.1 Pro' },
      { value: 'kling_2p1_master', label: 'Kling 2.1 Master' },
      { value: 'kling_2p5_turbo_pro', label: 'Kling 2.5 Turbo Pro' },
      { value: 'kling_2p6_pro', label: 'Kling 2.6 Pro' },
      { value: 'kling_3p0_standard', label: 'Kling 3.0 Standard' },
      { value: 'kling_3p0_pro', label: 'Kling 3.0 Pro' },
    ],
  },
  {
    label: 'Grok',
    options: [
      { value: 'grok_video', label: 'Grok Video' },
      { value: 'grok_imagine_video', label: 'Grok Imagine Video' },
      { value: 'grok_imagine_video_1p5', label: 'Grok Imagine Video 1.5' },
    ],
  },
  {
    label: 'Other',
    options: [{ value: 'happy_horse_1p0', label: 'Happy Horse 1.0' }],
  },
];

export const WEBSITE_OPTIONS: SelectOption[] = [
  { value: 'runway', label: 'Runway' },
  { value: 'higgsfield', label: 'Higgsfield' },
  { value: 'krea', label: 'Krea' },
  { value: 'open_art', label: 'OpenArt' },
  { value: 'artcraft', label: 'Artcraft' },
  { value: 'magnific', label: 'Magnific' },
  { value: 'free_pik', label: 'Freepik' },
];
