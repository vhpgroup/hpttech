import { HPT_DATA, type Post } from "@/lib/data";

export type PostWithSlug = Post & {
  slug: string;
};

export type PostSource = {
  getPosts: () => PostWithSlug[];
  getPostBySlug: (slug: string) => PostWithSlug | null;
};

export function createSeedPostSource(slugForPost: (post: Post) => string): PostSource {
  const getPosts = () =>
    HPT_DATA.posts.map((post) => ({
      ...post,
      slug: slugForPost(post),
    }));

  return {
    getPosts,
    getPostBySlug: (slug: string) => getPosts().find((post) => post.slug === slug) ?? null,
  };
}
