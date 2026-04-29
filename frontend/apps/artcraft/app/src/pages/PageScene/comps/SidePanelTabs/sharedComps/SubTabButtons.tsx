import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { TabTitles } from "~/enums";

export const SubTabButtons = ({
  currSubpage,
  subPageTitles,
  setSubpage,
  subPageTitleIcons,
}: {
  currSubpage: TabTitles;
  subPageTitles: TabTitles[];
  subPageTitleIcons?: IconDefinition[];
  setSubpage: (newTab: TabTitles) => void;
}) => {
  const leftMostButtonCss = "rounded-l-lg";
  const rightMostButtonCss = "rounded-r-lg";
  return (
    <div className="mx-4 flex">
      {subPageTitles.map((subPageTitle, idx) => {
        return (
          <button
            key={idx}
            className={twMerge(
              "flex h-8 grow cursor-pointer items-center justify-center gap-2 bg-brand-secondary p-2 text-xs font-medium transition-all",
              idx === 0 && leftMostButtonCss,
              idx === subPageTitles.length - 1 && rightMostButtonCss,
              currSubpage === subPageTitle
                ? "bg-brand-primary/85"
                : "hover:bg-brand-secondary-900",
            )}
            disabled={currSubpage === subPageTitle}
            onClick={() => setSubpage(subPageTitle)}
          >
            {subPageTitleIcons && subPageTitleIcons[idx] && (
              <FontAwesomeIcon icon={subPageTitleIcons[idx]} />
            )}
            {subPageTitle}
          </button>
        );
      })}
    </div>
  );
};
