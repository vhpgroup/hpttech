export type WordPressMedia = {
  source_url?: string;
};

export type WordPressRendered = {
  rendered?: string;
};

export type WordPressPost = {
  id: number;
  slug: string;
  date?: string;
  link?: string;
  title?: WordPressRendered;
  excerpt?: WordPressRendered;
  content?: WordPressRendered;
  _embedded?: {
    "wp:featuredmedia"?: WordPressMedia[];
  };
};

const WORDPRESS_API_BASE = process.env.WORDPRESS_API_BASE;

export function hasWordPressSource() {
  return Boolean(WORDPRESS_API_BASE);
}

export async function fetchWordPressPosts(path = "/wp-json/wp/v2/posts") {
  if (!WORDPRESS_API_BASE) return [];

  const url = new URL(path, WORDPRESS_API_BASE);
  url.searchParams.set("_embed", "1");

  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`WordPress request failed: ${response.status}`);
  }

  return (await response.json()) as WordPressPost[];
}
