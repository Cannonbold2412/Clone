import { AnnouncementBar } from "@/components/Chrome";

export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      {children}
    </>
  );
}
