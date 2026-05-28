import { useLayoutEffect, useRef } from "react";

export function useCommittedRef<T>(value: T) {
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
