import { useCallback, useEffect, useRef } from "react";
import type {
  TAction,
  TActionFunc,
  TActionHandlerOptions,
  TArgOfAction,
  TInvocationTrigger,
} from ".";
import { bindAction, unbindAction } from ".";

// eslint-disable-next-line opencut/prefer-object-params -- action subscriptions read best as (action, handler, isActive).
export function useActionHandler<A extends TAction>(
  action: A,
  handler: TActionFunc<A>,
  isActive: TActionHandlerOptions,
) {
  const handlerRef = useRef<TActionFunc<A>>(handler);
  const isBoundRef = useRef(false);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const stableHandler = useCallback(
    (...parameters: [TArgOfAction<A>, TInvocationTrigger?]) => {
      (
        handlerRef.current as (
          ...handlerParameters: [TArgOfAction<A>, TInvocationTrigger?]
        ) => void
      )(...parameters);
    },
    [],
  ) as TActionFunc<A>;

  useEffect(() => {
    const shouldBind =
      isActive === undefined ||
      (typeof isActive === "boolean" ? isActive : isActive.current);

    if (shouldBind && !isBoundRef.current) {
      bindAction(action, stableHandler);
      isBoundRef.current = true;
    } else if (!shouldBind && isBoundRef.current) {
      unbindAction(action, stableHandler);
      isBoundRef.current = false;
    }

    return () => {
      unbindAction(action, stableHandler);
      isBoundRef.current = false;
    };
  }, [action, stableHandler, isActive]);
}
