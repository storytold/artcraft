import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTiktok,
  faDiscord,
  faYoutube,
  faGithub,
  faGithubAlt,
} from "@fortawesome/free-brands-svg-icons";
import { SOCIAL_LINKS } from "../../config/links";
import { parseFrontmatter, pathToFilename } from "../../utils/markdown";

const faqFiles = import.meta.glob("../../pages/faq/content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
const tutorialFiles = import.meta.glob("../../pages/tutorials/content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const navigation = {
  main: [
    { name: "Home", href: "/" },
    { name: "Tutorials", href: "/tutorials" },
    { name: "FAQ", href: "/faq" },
    { name: "Download", href: "/download" },
  ],
  social: [
    {
      name: "Discord",
      href: SOCIAL_LINKS.DISCORD,
      icon: (props: any) => <FontAwesomeIcon icon={faDiscord} {...props} />,
    },
    {
      name: "YouTube",
      href: SOCIAL_LINKS.YOUTUBE,
      icon: (props: any) => <FontAwesomeIcon icon={faYoutube} {...props} />,
    },
    {
      name: "TikTok",
      href: SOCIAL_LINKS.TIKTOK,
      icon: (props: any) => <FontAwesomeIcon icon={faTiktok} {...props} />,
    },
    {
      name: "GitHub",
      href: SOCIAL_LINKS.GITHUB,
      icon: (props: any) => <FontAwesomeIcon icon={faGithubAlt} {...props} />,
    },
  ],
};

export default function Example() {
  return (
    <footer className="bg-transparent">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-16 sm:py-16 lg:px-8 flex flex-col gap-12 items-center">
        {/* <Button
          icon={faArrowDownToLine}
          className="w-fit"
          onClick={() => window.open("/download", "_self")}
        >
          Download ArtCraft
        </Button> */}
        {/* <nav
          aria-label="Footer"
          className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm/6"
        >
          {navigation.main.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-gray-400 hover:text-white"
            >
              {item.name}
            </a>
          ))}
        </nav> */}
        <div className="w-full flex flex-col items-center gap-10">
          <div className="flex justify-center gap-x-10 mb-8">
            {navigation.social.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                className="text-gray-400 hover:text-gray-300 transition-all"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon
                  aria-hidden="true"
                  className="size-6 text-white/70"
                />
              </a>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 text-sm/6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="text-gray-200 mb-1">Pages</div>
              <a href="/" className="text-gray-400 hover:text-white">
                Home
              </a>
            </div>
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="text-gray-200 mb-1">Tutorials</div>
              <a href="/tutorials" className="text-gray-400 hover:text-white">
                All Tutorials
              </a>
              {Object.entries(tutorialFiles).map(([path, raw]) => {
                const { frontmatter } = parseFrontmatter(raw as string);
                const slug = pathToFilename(path);
                if (frontmatter.isPublished === "false") return null;
                return (
                  <a
                    key={slug}
                    href={`/tutorials/${slug}`}
                    className="text-gray-400 hover:text-white"
                  >
                    {frontmatter.title || slug}
                  </a>
                );
              })}
            </div>
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="text-gray-200 mb-1">FAQ</div>
              <a href="/faq" className="text-gray-400 hover:text-white">
                All FAQs
              </a>
              {Object.entries(faqFiles).map(([path, raw]) => {
                const { frontmatter } = parseFrontmatter(raw as string);
                const slug = pathToFilename(path);
                if (frontmatter.isPublished === "false") return null;
                const title = (frontmatter.title || slug) as string;
                const truncated =
                  title.length > 36 ? title.slice(0, 33) + "…" : title;
                return (
                  <a
                    key={slug}
                    href={`/faq/${slug}`}
                    className="text-gray-400 hover:text-white"
                  >
                    {truncated}
                  </a>
                );
              })}
            </div>
          </div>
          <p className="text-center text-sm/6 text-gray-400">
            &copy; 2025 ArtCraft. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
