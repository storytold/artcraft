import { useSignals } from "@preact/signals-react/runtime";
import { twMerge } from "tailwind-merge";
import { faFilm } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";

import { activeWorkflowJobs } from "~/signals";

export const MyMoviesButton = () => {
  useSignals();
  const activeCount = activeWorkflowJobs.value
    ? activeWorkflowJobs.value.length
    : 0;

  return (
    <div className="relative">
      <Button
        variant="action"
        onClick={() => {
          const store = usePageEnigmaStore.getState();
          store.setGenerateMovieId("");
          store.setViewMyMovies(true);
        }}
      >
        <div className="relative flex items-center gap-2">
          {activeCount > 0 ? (
            <svg
              className="h-4 w-4 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <FontAwesomeIcon icon={faFilm} />
          )}
          <div>My Movies</div>
        </div>
      </Button>
      <div
        className={twMerge(
          "invisible absolute right-[-7px] top-[-7px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-brand-primary text-[13px] font-medium text-white",
          activeCount > 0 && "visible",
        )}
      >
        {activeCount}
      </div>
    </div>
  );
};
