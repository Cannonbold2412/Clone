import Link from "next/link";
import { AnnouncementBar, FlowHeader } from "@/components/Chrome";

export default function NotFound() {
  return (
    <>
      <AnnouncementBar />
      <FlowHeader />
      <div className="container-x py-24 text-center">
        <p className="text-[64px] font-bold leading-none">404</p>
        <h1 className="mt-4 text-[20px] font-semibold">Page not found</h1>
        <p className="mt-2 text-[14px] text-muted">The page you are looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="btn-black mt-8 inline-flex h-12 items-center px-10 text-[15px]">Go to Home</Link>
      </div>
    </>
  );
}
