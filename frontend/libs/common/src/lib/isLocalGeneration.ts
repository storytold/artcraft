/** Classify local-looking media IDs without treating them as validated filesystem paths. */
export const isLocalGeneration = (id: string): boolean => id.startsWith("local_file_");
