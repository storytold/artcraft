export function objectMismatch(
  inputObj: Record<string, string>,
  refObj: Record<string, number>,
) {
  return Object.keys(inputObj).some(
    (currentKey: string) =>
      parseFloat(inputObj[currentKey]) !== refObj[currentKey],
  );
}
