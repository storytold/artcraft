import { useSignals } from "@preact/signals-react/runtime";
import { faFilm, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CompletedCard } from "~/pages/PageEnigma/comps/GenerateModals/CompletedCard";
import { InProgressCard } from "~/pages/PageEnigma/comps/GenerateModals/InProgressCard";
import { Modal } from "@storyteller/ui-modal";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";
import { activeWorkflowJobs, userMovies } from "~/signals";

interface Props {
  setMovieId: (page: string) => void;
}

export function MyMovies({ setMovieId }: Props) {
  useSignals();
  const viewMyMovies = usePageEnigmaStore((s) => s.viewMyMovies);
  const setViewMyMovies = usePageEnigmaStore((s) => s.setViewMyMovies);

  return (
    <Modal
      title="My Movies"
      titleIcon={faFilm}
      className="max-w-4xl"
      childPadding={false}
      isOpen={viewMyMovies}
      onClose={() => {
        setMovieId("");
        setViewMyMovies(false);
      }}
    >
      <div className="h-[560px] overflow-y-auto overflow-x-hidden rounded-b-lg">
        {activeWorkflowJobs.value && activeWorkflowJobs.value.length > 0 && (
          <div className="mb-3">
            <div className="mx-5 mb-1 font-medium">In Progress</div>
            {activeWorkflowJobs.value.map((movieJob) => (
              <InProgressCard key={movieJob.job_token} movie={movieJob} />
            ))}
          </div>
        )}
        <MovieList setMovieId={setMovieId} />
      </div>
    </Modal>
  );
}

const MovieList = ({ setMovieId }: Props) => {
  useSignals();
  if (!userMovies.value && !activeWorkflowJobs.value) {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-6 text-center align-middle">
        <FontAwesomeIcon icon={faSpinnerThird} spin size={"3x"} />
        <h3>Retrieving Completed Movies</h3>
      </div>
    );
  }
  if (
    userMovies.value &&
    userMovies.value.length === 0 &&
    !activeWorkflowJobs.value
  ) {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-6 text-center align-middle">
        <h3>You have not created any movies yet!</h3>
        <p>
          Try start a new scene from our featured scenes, and generate a movie
          via the <b>AI Stylize</b> tab.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="mx-5 mb-1 font-medium">Completed</div>
      <div className="flex flex-col">
        {userMovies.value?.map((movie) => (
          <CompletedCard
            key={movie.token}
            movie={movie}
            setMovieId={setMovieId}
          />
        ))}
      </div>
    </div>
  );
};
