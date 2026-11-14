import { useCallback, useEffect, useLayoutEffect, useState } from "react";
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

  const [timerState, setTimerState] = useState<{
    timer: NodeJS.Timeout | undefined;
    interval: number;
  }>({
    timer: undefined,
    interval: TWO_SECONDS,
  });

  const resetTimer = useCallback((newTimeInterval: number) => {
    setTimerState((curr) => {
      if (!curr.timer) {
        // if no timer, just change interval
        return {
          timer: curr.timer,
          interval: newTimeInterval,
        };
      }
      // if timer already exist, first clear
      // then set new one with new interval
      clearInterval(curr.timer);
      const newTimer = setInterval(() => {
        PollRecentJobs();
      }, newTimeInterval);
      return {
        timer: newTimer,
        interval: newTimeInterval,
      };
    });
  }, []);

  const clearTimer = useCallback(() => {
    if (timerState.timer) {
      clearInterval(timerState.timer);
      setTimerState((curr) => ({
        ...curr,
        timer: undefined,
      }));
    }
  }, [timerState.timer]);

  useEffect(() => {
    return () => {
      //make sure we run clear timer as well on dismount;
      clearInterval(timerState.timer);
    };
  }, [timerState.timer]);

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
      if (!hasShortJobs && timerState.interval < TEN_SECONDS) {
        resetTimer(TEN_SECONDS);
      }
      if (hasShortJobs && timerState.interval > TWO_SECONDS) {
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
      setTimerState((curr) => {
        if (curr.timer) {
          //do nothing if timer is already running;
          return curr;
        }

        //else make and set timer
        const newTimer = setInterval(() => {
          PollRecentJobs();
        }, curr.interval);
        return {
          ...curr,
          timer: newTimer,
        };
      });
      return;
    }
    // should not poll, then clear timer
    clearTimer();
  });
};
