import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(_: Request, { params }: RouteContext) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return NextResponse.json({ error: "Missing post slug." }, { status: 400 });
  }

  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "posts",
      depth: 0,
      limit: 1,
      where: {
        and: [{ slug: { equals: normalizedSlug } }, { status: { equals: "published" } }],
      },
    });

    const doc = result.docs[0];
    if (!doc) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const currentViewCount = typeof doc.viewCount === "number" ? doc.viewCount : 0;
    const nextViewCount = currentViewCount + 1;

    await payload.update({
      collection: "posts",
      id: doc.id,
      depth: 0,
      data: {
        viewCount: nextViewCount,
      },
    });

    return NextResponse.json({ ok: true, viewCount: nextViewCount });
  } catch (error) {
    console.error("[posts/view] Failed to increment post view count.", error);
    return NextResponse.json({ error: "Unable to update post view count." }, { status: 500 });
  }
}
