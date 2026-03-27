export const PAGE_SIZE_OPTIONS = [4, 8, 12, 16] as const;
export type PageSizeChoice = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSizeChoice = 8;
