export function capitalizeFirstLetter({ string }: { string: string }) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function uppercase({ string }: { string: string }) {
  return string.toUpperCase();
}
