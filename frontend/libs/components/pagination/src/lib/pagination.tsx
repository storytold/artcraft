import {
  faChevronRight,
  faChevronLeft,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { ButtonIcon } from "@storyteller/ui-button-icon";

export const Pagination = ({
  className,
  currentPage,
  totalPages,
  onPageChange,
  onFetchMorePages,
}: {
  className: string;
  currentPage: number; // index starts from 0
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onFetchMorePages?: () => void;
}) => {
  const pageGroupSize = 5;
  const pageGroup = Math.floor(currentPage / pageGroupSize);
  const totalPagesInPageGroup =
    (pageGroup + 1) * pageGroupSize > totalPages
      ? totalPages % pageGroupSize
      : pageGroupSize;
  const pageGroupOffset = pageGroup * pageGroupSize;

  const handleSetPreviousPage = () => {
    onPageChange(currentPage - 1);
  };
  const handleSetNextPage = () => {
    onPageChange(currentPage + 1);
  };

  return (
    <nav
      className={twMerge(
        "flex items-center justify-between border-gray-200 px-4",
        className,
      )}
    >
      <ButtonIcon
        className="-ml-2 pt-2 text-gray-400"
        icon={faChevronLeft}
        onClick={handleSetPreviousPage}
        disabled={currentPage === 0}
        aria-hidden
      />
      <div className="hidden md:flex">
        {[...Array(totalPagesInPageGroup)].map((e, i) => {
          const pageIndex = i + pageGroupOffset;
          if (pageIndex === currentPage) {
            return (
              <button
                key={pageIndex}
                className="border-indigo-500 text-indigo-600 inline-flex items-center border-t-2 px-4 pt-2 text-sm font-medium"
                aria-current="page"
                onClick={() => onPageChange(pageIndex)}
              >
                {pageIndex + 1}
              </button>
            );
          } else {
            return (
              <button
                key={pageIndex}
                className="inline-flex items-center border-t-2 border-transparent px-4 pt-2 text-sm font-medium text-gray-500 hover:border-brand-primary hover:text-brand-primary"
                onClick={() => onPageChange(pageIndex)}
              >
                {pageIndex + 1}
              </button>
            );
          }
        })}
      </div>
      <span>
        {currentPage + 1 !== totalPages ? (
          <ButtonIcon
            className="-mr-2 pt-2 text-gray-500 hover:text-brand-primary"
            icon={faChevronRight}
            onClick={handleSetNextPage}
            aria-hidden
          />
        ) : (
          onFetchMorePages && (
            <button
              className="inline-flex items-center border-t-2 border-transparent pl-2 pr-4 pt-2 text-sm font-medium text-gray-500 hover:text-brand-primary"
              key={totalPages}
              onClick={onFetchMorePages}
            >
              More...
            </button>
          )
        )}
      </span>
    </nav>
  );
};
