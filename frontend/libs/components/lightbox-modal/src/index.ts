// Public entry point of the `lightbox-modal` library: everything another package can import from "@storyteller/ui-lightbox-modal"
// (the library's import name in the workspace) is whatever is re-exported here; files not listed stay private to the library.
// The lightbox dialog itself (`LightboxModal` and its helpers), the component the app opens when a user clicks a generated file.
export * from './lib/lightbox-modal';
// The "Tags" section of the details panel (chips, autocomplete, serialized saves). Inside this repo the only user is
// `lightbox-modal.tsx`, but it is exported so a host app (such as the website) can mount it with its own username and suggestions.
export * from './lib/tags/TagsSection';
// The chip input box and the `TagSuggestion` type that `TagsSection` takes as autocomplete data.
export * from './lib/tags/TagChipInput';
