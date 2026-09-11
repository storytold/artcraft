
// TODO: It might be better to have top-level boolean fields on the models.

export enum ModelTag {
  // Models that show up in the 2D and 3D editors
  InstructiveEdit = "instructiveEdit",

  // Models that show up in the inpainting editor and that use masking.
  MaskedInpainting = "maskedInpainting",

  // Models that show up in the inpainting editor, but that do not use masking.
  NonMaskedInpainting = "nonMaskedInpainting",
}
