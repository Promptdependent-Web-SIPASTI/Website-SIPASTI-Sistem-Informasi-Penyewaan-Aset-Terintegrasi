import UtilityBar from "@/components/UtilityBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SiteLayout({ children }) {
  return (
    <>
      <UtilityBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
