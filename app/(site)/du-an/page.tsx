import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient";
import { getProjectsFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Dự án tiêu biểu",
  description: "Các dự án công nghệ, thiết bị văn phòng và giải pháp số hóa HPT Tech đã triển khai.",
  path: "/du-an",
});

type ProjectsPageProps = {
  searchParams: Promise<{
    "danh-muc"?: string;
    "linh-vuc"?: string;
    q?: string;
    "sap-xep"?: string;
    page?: string;
  }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const [projects, params] = await Promise.all([getProjectsFromPayload(), searchParams]);
  const page = Number.parseInt(params.page || "1", 10);

  return (
    <ProjectsPageClient
      projects={projects}
      initialCategory={params["danh-muc"] || params["linh-vuc"]}
      initialIndustry={params["linh-vuc"]}
      initialQuery={params.q}
      initialSort={params["sap-xep"]}
      initialPage={Number.isFinite(page) ? page : 1}
    />
  );
}
