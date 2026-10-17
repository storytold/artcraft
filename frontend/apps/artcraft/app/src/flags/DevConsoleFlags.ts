
// This is used to do things such as disable job polling in the dev console.

// The shape of the dev-console hooks we hang off `window`.
type DevFlagWindow = Window & {
  _dev_flags?: Record<string, unknown>;
  setDevFlag?: typeof SetDevFlag;
  getDevFlag?: typeof GetDevFlag;
  disableJobPolling?: typeof DisableJobPolling;
  enableJobPolling?: typeof EnableJobPolling;
};

const devWindow = window as DevFlagWindow;

export const SetDevFlag = (flagName: string, value: unknown) => {
  if (!devWindow._dev_flags) {
    devWindow._dev_flags = {};
  }
  devWindow._dev_flags[flagName] = value;
}

export const GetDevFlag = (flagName: string): unknown => {
  if (devWindow._dev_flags && flagName in devWindow._dev_flags) {
    return devWindow._dev_flags[flagName];
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

devWindow.setDevFlag = SetDevFlag;
devWindow.getDevFlag = GetDevFlag;

devWindow.disableJobPolling = DisableJobPolling;
devWindow.enableJobPolling = EnableJobPolling;


