import { AnnouncementBar, Header, MobileTabBar } from "@/components/Chrome";
import { Footer } from "@/components/Footer";
import { navData } from "@/lib/catalog";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const { nav, searched } = await navData();
  return (
    <>
      <AnnouncementBar />
      <Header nav={nav} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer searched={searched} />
      <MobileTabBar nav={nav} />
    </>
  );
}
