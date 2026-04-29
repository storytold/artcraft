import { signal } from "@preact/signals-core";
import { Pages } from "~/pages/PageScene/constants/page";

export const pageHeight = signal(0);
export const pageWidth = signal(0);
export const currentPage = signal(Pages.EDIT);
