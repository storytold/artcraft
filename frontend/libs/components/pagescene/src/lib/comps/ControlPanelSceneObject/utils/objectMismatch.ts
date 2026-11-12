export function objectMismatch(
  inputObj: Record<string, string>,
  refObj: Record<string, number>,
) {
  return Object.keys(inputObj).some(
    (currentKey: string) =>
      Number.parseFloat(inputObj[currentKey]) !== refObj[currentKey],
  );
}
