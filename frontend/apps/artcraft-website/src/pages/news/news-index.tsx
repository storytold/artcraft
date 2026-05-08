import { NewsIndex as LibNewsIndex } from "@storyteller/markdown-content";
import Seo from "../../components/seo";
import Footer from "../../components/footer";
import { PagePatternBackdrop } from "../../components/truchet-pattern";

const NewsIndex = ({ basePath }: { basePath: string }) => {
  return (
    <div className="relative min-h-screen bg-[#101014] overflow-hidden">
      <Seo
        title="News & Updates - ArtCraft"
        description="Latest updates, features, and announcements from the ArtCraft team."
      />
      <PagePatternBackdrop variant="content" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10">
        <LibNewsIndex basePath={basePath} />
        <Footer />
      </div>
    </div>
  );
};

export default NewsIndex;
