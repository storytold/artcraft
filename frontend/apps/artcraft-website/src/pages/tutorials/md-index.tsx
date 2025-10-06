import { Link } from "react-router-dom";
import Seo from "../../components/seo";
import { parseFrontmatter, pathToFilename } from "../../utils/markdown";

const tutorialFiles = import.meta.glob("./content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const TutorialsIndex = () => {
  const title = "Tutorials - ArtCraft";
  const description =
    "Learn tips, tricks, and workflows for ArtCraft with step-by-step guides.";

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
      <Seo title={title} description={description} />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-25 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-8 pt-28 sm:pt-36 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-6xl font-bold mb-3">Tutorials</h1>
          <p className="text-white/70 text-base sm:text-lg">
            Step-by-step guides to master ArtCraft.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(tutorialFiles).map(([path, raw]) => {
            const { frontmatter } = parseFrontmatter(raw as string);
            const slug = pathToFilename(path);
            if (frontmatter.isPublished === "false") return null;
            const title = frontmatter.title || slug;
            const description = frontmatter.abstract || "";
            return (
              <Link
                key={slug}
                to={`/tutorials/${slug}`}
                className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-5"
              >
                <h2 className="text-xl font-semibold mb-2">{title}</h2>
                <p className="text-white/70 text-sm">{description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TutorialsIndex;
