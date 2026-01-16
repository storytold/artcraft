import { parseFrontmatter, pathToFilename } from "../utils/markdown";

// NEWS
const newsFiles = import.meta.glob("../content/news/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export interface NewsPostData {
  slug: string;
  title: string;
  description: string;
  date: string;
  body: string;
  thumbnail?: string;
}

export const getNewsPosts = (): NewsPostData[] => {
  return Object.entries(newsFiles)
    .map(([path, raw]) => {
      const { frontmatter, body } = parseFrontmatter(raw as string);
      const slug = pathToFilename(path);
      return {
        slug,
        title: frontmatter.title || slug,
        description: frontmatter.abstract || "",
        date: frontmatter.date || "",
        thumbnail: frontmatter.thumbnail,
        body,
      };
    })
    .sort((a, b) => {
      if (a.date && b.date)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      return 0; // consistent output
    });
};

export const getNewsPostBySlug = (slug: string): NewsPostData | null => {
  const posts = getNewsPosts();
  return posts.find((p) => p.slug === slug) || null;
};

// FAQ
const faqFiles = import.meta.glob("../content/faq/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export interface FaqItem {
  slug: string;
  title: string;
  description: string;
  body: string;
  isPublished: boolean;
  thumbnail?: string;
}

export const getFaqItems = (): FaqItem[] => {
  return Object.entries(faqFiles).map(([path, raw]) => {
    const { frontmatter, body } = parseFrontmatter(raw as string);
    const slug = pathToFilename(path);
    return {
      slug,
      title: frontmatter.title || slug,
      description: frontmatter.abstract || "",
      body,
      isPublished: frontmatter.isPublished !== "false",
      thumbnail: frontmatter.thumbnail,
    };
  });
};

export const getFaqItemBySlug = (slug: string): FaqItem | null => {
  const items = getFaqItems();
  return items.find(i => i.slug === slug) || null;
};


// TUTORIALS
const tutorialFiles = import.meta.glob("../content/tutorials/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export interface TutorialItem {
  slug: string;
  title: string;
  abstract: string;
  category?: string;
  thumbnail?: string;
  videoUrl?: string;
  youtubeId?: string;
  aliases?: string[];
  body: string;
  isPublished: boolean;
}

export const getTutorialItems = (): TutorialItem[] => {
  return Object.entries(tutorialFiles).map(([path, raw]) => {
    const { frontmatter, body } = parseFrontmatter(raw as string);
    const slug = pathToFilename(path);
    return {
      slug: (frontmatter.slug || slug).trim().toLowerCase(),
      title: frontmatter.title || slug,
      abstract: frontmatter.abstract || "",
      category: frontmatter.category,
      thumbnail: frontmatter.thumbnail,
      videoUrl: frontmatter.videoUrl,
      youtubeId: frontmatter.youtubeId,
      aliases: frontmatter.aliases ? frontmatter.aliases.split(/[\s,]+/).map(s => s.trim().toLowerCase()).filter(Boolean) : [],
      body,
      isPublished: frontmatter.isPublished !== "false",
    };
  });
};

export const getTutorialItemBySlug = (slug: string): TutorialItem | null => {
    const items = getTutorialItems();
    const wanted = slug.toLowerCase();
    return items.find(t => t.slug === wanted || t.aliases?.includes(wanted)) || null;
};
