// runs sanitizeNumericInput on each axis, creating a new object of sanitized values
export function sanitize(xyz: Record<string, string>) {
  return Object.keys(xyz).reduce(
    (obj, currentKey) => {
      return {
        ...obj,
        [currentKey]: sanitizeNumericInput(xyz[currentKey].toString()),
      };
    },
    {} as Record<string, number>,
  );
}

// clears leading and trailing zeros
function sanitizeNumericInput(input: string): number {
  const parts = input.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const decimal = decimalPart !== "" ? parseFloat(`.${decimalPart}`) : 0.0;

  if (integerPart === undefined) {
    return decimal;
  }

  // FIX: ".5" and "-.5" have no digits before the dot (or only a sign), so
  // parseInt gave NaN and the whole result became NaN. Treat that as 0.
  const integer =
    integerPart === "" || integerPart === "-" ? 0 : parseInt(integerPart);

  if (decimalPart === undefined) {
    return integer;
  }

  if (Number(input) > 0) {
    return integer + decimal;
  }
  return integer - decimal;
}
