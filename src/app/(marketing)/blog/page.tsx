import { BlogLinks } from "@/components/marketing/blogLinks";
import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="container relative mx-auto py-12">
      <Link href="/" className="absolute left-0 top-0 p-4 text-sm text-muted-foreground hover:underline">
        &larr; Home
      </Link>
      <h1 className="mb-8 text-4xl font-bold tracking-tight">ChiTrack Blog</h1>
      <BlogLinks />
    </div>
  );
}
