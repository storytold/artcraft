// Everything the help-menu file exports (HelpMenuButton, HelpMenuButtonProps and its default) is re-exported from the package's front door.
export * from "./lib/help-menu";
// Older code imports the same component under the name TutorialModalButton; this keeps that name working.
export { HelpMenuButton as TutorialModalButton } from "./lib/help-menu";
// The tutorial list, TutorialItem and TutorialCategory are public too, so a caller can build its own list.
export * from "./lib/tutorials";

