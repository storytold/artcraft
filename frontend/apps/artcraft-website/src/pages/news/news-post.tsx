import {
  NewsPost as LibNewsPost,
  getNewsPostBySlug,
} from "@storyteller/markdown-content";
import Seo from "../../components/seo";
import Footer from "../../components/footer";
import { PagePatternBackdrop } from "../../components/truchet-pattern";
import { useParams } from "react-router-dom";

const NewsPost = ({ basePath }: { basePath: string }) => {
  const { slug } = useParams();
  const post = slug ? getNewsPostBySlug(slug) : null;

  const title = post
    ? `${post.title} - ArtCraft`
    : "Article Not Found - ArtCraft";
  const desc = post ? post.description : "";

  return (
    <div className="relative min-h-screen bg-[#101014] overflow-hidden">
      <Seo title={title} description={desc} />
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
        <LibNewsPost basePath={basePath} />
        <Footer />
      </div>
    </div>
  );
};

export default NewsPost;
