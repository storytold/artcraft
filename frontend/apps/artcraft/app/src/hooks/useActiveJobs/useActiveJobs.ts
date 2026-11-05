import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";

import { JobType } from "~/enums";

import {
  activeJobs,
  shouldPollActiveJobs,
  startPollingActiveJobs,
  stopPollingActiveJobs,
} from "~/signals";

import { PollRecentJobs } from "./utilities";
import { TEN_SECONDS, TWO_SECONDS } from "~/constants";
import { WindowExtended } from "./types";

export const useActiveJobs = () => {
  useSignals();

  // The poll timer and its interval live in refs, not state. They used to be
  // state that was changed inside setState updater functions which also
  // called setInterval: React may run an updater twice (StrictMode), which
  // started a second interval nobody tracked, so polling could never be
  // stopped; and every timer change re-rendered the host for no reason.
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );
  const intervalRef = useRef<number>(TWO_SECONDS);

  const resetTimer = useCallback((newTimeInterval: number) => {
    intervalRef.current = newTimeInterval;
    if (!timerRef.current) {
      // if no timer, just change interval
      return;
    }
    // if timer already exist, first clear
    // then set new one with new interval
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      PollRecentJobs();
    }, newTimeInterval);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    return () => {
      //make sure we run clear timer as well on dismount;
      clearTimer();
    };
  }, [clearTimer]);

  useLayoutEffect(() => {
    //TODO: add dev account guard
    (window as WindowExtended).stopPollingActiveJobs = stopPollingActiveJobs;
  }, []);

  useSignalEffect(() => {
    // if active jobs is not initiated, do do a first pull;
    if (!activeJobs.value) {
      PollRecentJobs();
      return;
    }
    // if there are no active jobs, stop making polls
    if (activeJobs.value.length === 0) {
      stopPollingActiveJobs();
      return;
    }

    if (activeJobs.value.length > 0) {
      // if there are active jobs, first, manage polling interval
      const hasShortJobs =
        activeJobs.value.find((job) => {
          return (
            job.request.inference_category === JobType.TextToSpeech ||
            job.request.inference_category === JobType.VoiceConversion
          );
        }) !== undefined;
      if (!hasShortJobs && intervalRef.current < TEN_SECONDS) {
        resetTimer(TEN_SECONDS);
      }
      if (hasShortJobs && intervalRef.current > TWO_SECONDS) {
        resetTimer(TWO_SECONDS);
      }

      // if there are active jobs, and is not polling, start polling
      if (!shouldPollActiveJobs.value) {
        startPollingActiveJobs();
      }
    }
  });

  useSignalEffect(() => {
    //trigger the pull via a timer
    if (shouldPollActiveJobs.value) {
      //do nothing if timer is already running;
      if (!timerRef.current) {
        //else make and set timer
        timerRef.current = setInterval(() => {
          PollRecentJobs();
        }, intervalRef.current);
      }
      return;
    }
    // should not poll, then clear timer
    clearTimer();
  });
};
