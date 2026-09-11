
// This is used to do things such as disable job polling in the dev console.

export const SetDevFlag = (flagName: string, value: any) => {
  if (!!!(window as any)._dev_flags) {
    (window as any)._dev_flags = {};
  }
  (window as any)._dev_flags[flagName] = value;
}

export const GetDevFlag = (flagName: string) => {
  if (!!(window as any)._dev_flags && flagName in (window as any)._dev_flags) {
    return (window as any)._dev_flags[flagName];
  }
  return null;
}

export const DisableJobPolling = () => {
  SetDevFlag("disable_job_polling", true);
}

export const EnableJobPolling = () => {
  SetDevFlag("disable_job_polling", false);
}

export const IsJobPollingDisabled = () : boolean => {
  return GetDevFlag("disable_job_polling") === true;
}

(window as any).setDevFlag = SetDevFlag;
(window as any).getDevFlag = GetDevFlag;

(window as any).disableJobPolling = DisableJobPolling;
(window as any).enableJobPolling = EnableJobPolling;


