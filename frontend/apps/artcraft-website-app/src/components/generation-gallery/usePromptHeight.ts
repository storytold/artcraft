import { useEffect, useRef, useState } from "react";

export function usePromptHeight() {
  const promptBoxRef = useRef<HTMLDivElement>(null);
  const [promptHeight, setPromptHeight] = useState(138);

  useEffect(() => {
    const el = promptBoxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setPromptHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { promptBoxRef, promptHeight };
}
