import { Params } from "react-router-dom";
import { JobStatus } from "./enums";
import deepEqual from "deep-equal";

export const isObjectSerializable = (obj: object) => {
  return deepEqual(obj, deepCopySerializableObjects(obj));
};

export const deepCopySerializableObjects = (obj: object) => {
  return JSON.parse(JSON.stringify(obj));
};

export const kebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

export const getCurrentLocationWithoutParams = (
  path: string,
  params: Readonly<Params<string>>,
) => {
  let result = path;
  Object.keys(params).forEach((key) => {
    result = result.replace("/" + params[key] || "", "");
  });
  if (result[result.length - 1] !== "/") result = result + "/";
  return result;
};

export const isJobStatusTerminal = (curr: JobStatus) => {
  if (
    curr === JobStatus.PENDING ||
    curr === JobStatus.STARTED ||
    curr === JobStatus.ATTEMPT_FAILED
  ) {
    return false;
  }
  return true;
};

export const isNumberString = (value: string) => {
  return !isNaN(Number(value));
};

export const isJobStatusError = (curr: JobStatus) => {
  if (
    curr === JobStatus.ATTEMPT_FAILED ||
    curr === JobStatus.COMPLETE_FAILURE ||
    curr === JobStatus.DEAD
  ) {
    return true;
  }
  return false;
};

export const getFileName = (file: File) => {
  return file.name.substring(0, file.name.lastIndexOf("."));
};
export const getFileExtension = (file: File) => {
  return file.name.substring(file.name.lastIndexOf("."));
};

export const getFileTypesFromEnum = (enumOfTypes: object) => {
  return Object.keys(enumOfTypes);
};
