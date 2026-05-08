import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleQuestion,
  faEnvelope,
  faChevronRight,
} from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Seo from "../../components/seo";
import Footer from "../../components/footer";
import { SOCIAL_LINKS, SUPPORT_EMAIL } from "../../config/links";

type SupportRow = {
  icon: IconDefinition;
  title: string;
  desc: string;
  to?: string;
  href?: string;
  iconBgClass?: string;
  iconColorClass?: string;
};

const ROWS: SupportRow[] = [
  {
    icon: faDiscord,
    title: "Join our Discord",
    desc: "The fastest way to reach us. Quick replies from the team and credit refunds if something goes wrong.",
    href: SOCIAL_LINKS.DISCORD,
    iconBgClass: "bg-[#5865F2] border-[#5865F2]/60",
    iconColorClass: "text-white",
  },
  {
    icon: faEnvelope,
    title: "Email us",
    desc: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    icon: faCircleQuestion,
    title: "Browse the FAQ",
    desc: "Answers to common questions about ArtCraft.",
    to: "/faq",
  },
];

const Support = () => {
  const title = "Support - ArtCraft";
  const description =
    "Get help with ArtCraft: browse the FAQ, join our Discord community, or email us directly.";

  return (
    <div className="relative min-h-screen bg-[#101014] text-white">
      <Seo title={title} description={description} />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
        <header className="mb-8 sm:mb-10 flex flex-col items-center text-center gap-3">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em]">
            Support
          </h1>
          <p className="text-[15px] sm:text-base text-white/60 max-w-xl">
            Find answers, join the community, or reach us directly. We&rsquo;re
            happy to help.
          </p>
        </header>

        <ul className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.02]">
          {ROWS.map((row) => (
            <li key={row.title}>
              <SupportLink row={row} />
            </li>
          ))}
        </ul>
      </main>

      <Footer />
    </div>
  );
};

const SupportLink = ({ row }: { row: SupportRow }) => {
  const className =
    "group flex items-center gap-4 px-4 py-4 sm:px-5 sm:py-5 transition-colors duration-150 hover:bg-white/[0.03]";

  const content = (
    <>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors ${
          row.iconBgClass ?? "bg-white/[0.04] border-white/[0.06]"
        } ${row.iconColorClass ?? "text-white/70 group-hover:text-white"}`}
      >
        <FontAwesomeIcon icon={row.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium text-white">{row.title}</div>
        <div className="text-sm text-white/60">{row.desc}</div>
      </div>
      <FontAwesomeIcon
        icon={faChevronRight}
        className="text-xs text-white/30 group-hover:text-white/60 transition-colors"
      />
    </>
  );

  if (row.to) {
    return (
      <Link to={row.to} className={className}>
        {content}
      </Link>
    );
  }

  const isMailto = row.href?.startsWith("mailto:");
  return (
    <a
      href={row.href}
      target={isMailto ? undefined : "_blank"}
      rel={isMailto ? undefined : "noopener noreferrer"}
      className={className}
    >
      {content}
    </a>
  );
};

export default Support;
