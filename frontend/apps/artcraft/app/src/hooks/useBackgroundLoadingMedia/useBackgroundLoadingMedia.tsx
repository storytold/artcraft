import { useRef } from "react";
import { untracked } from "@preact/signals-core";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { PollUserGeneratedMovies, PollUserAudioItems } from "./utilities";

import {
  authentication,
  completedAudioJobs,
  completedWorkflowJobs,
  userMovies,
  userAudioItems,
  addToast,
} from "~/signals";

import { ToastTypes } from "~/enums";
import { Job } from "~/models";
import deepEqual from "deep-equal";

export const useBackgroundLoadingMedia = () => {
  const lastCompletedWorkflow = useRef<Job[] | undefined>(undefined);
  const lastCompletedAudioJobs = useRef<Job[] | undefined>(undefined);

  useSignals();

  useSignalEffect(() => {
    //CASE 1: first load
    // if myMovies undefined, poll for the first time
    if (!userMovies.value) {
      // WHY untracked: the poller reads and writes isRetreivingUserMovies, and an
      // effect subscribes to every signal read synchronously inside it. The flag
      // going back to false (in the poller's `finally`, before userMovies is set)
      // re-ran this effect, so first load sent a duplicate request, and a FAILED
      // request retried forever (request storm + error toasts). Login state is
      // read explicitly instead: the poller is a no-op while logged out, so a
      // later login must still re-trigger the first load.
      void authentication.userInfo.value;
      untracked(() => PollUserGeneratedMovies());
      return;
    }

    //CASE 2: pull after jobs completion
    if (!completedWorkflowJobs.value) {
      return; // nothing to do if jobs is not initiated
    }
    if (!lastCompletedWorkflow.current) {
      lastCompletedWorkflow.current = completedWorkflowJobs.value;
      return; // set first pull of jobs, no need to poll again yet
    }
    if (
      completedWorkflowJobs.value.length === 0 ||
      deepEqual(lastCompletedWorkflow.current, completedWorkflowJobs.value)
    ) {
      return;
    } // if no jobs; or if already poll for these completed job, do not poll again

    //there are videos newly completed, set and poll
    lastCompletedWorkflow.current = completedWorkflowJobs.value;
    PollUserGeneratedMovies().then((ret: boolean) => {
      if (ret) {
        addToast(
          ToastTypes.SUCCESS,
          "New movie is completed! Please check My Movies",
          false,
        );
      }
    });
  });

  useSignalEffect(() => {
    //CASE 1: first load
    // if audioItems undefined, poll for the first time
    if (!userAudioItems.value) {
      PollUserAudioItems();
      return;
    }

    //CASE 2: pull after jobs completion
    if (!completedAudioJobs.value) {
      return; // nothing to do if jobs is not initiated
    }
    if (!lastCompletedAudioJobs.current) {
      lastCompletedAudioJobs.current = completedAudioJobs.value;
      return; // set first pull of jobs, no need to poll again yet
    }
    if (
      completedAudioJobs.value.length === 0 ||
      deepEqual(lastCompletedAudioJobs.current, completedAudioJobs.value)
    ) {
      return;
      // if no jobs; or if already poll for these completed job, do not poll again
    }

    //there are audio jobs newly completed, set and poll
    lastCompletedAudioJobs.current = completedAudioJobs.value;
    PollUserAudioItems().then((ret: boolean) => {
      if (ret) {
        addToast(
          ToastTypes.SUCCESS,
          "New audio is generated! Please check your audio library",
        );
      }
    });
  });
};
