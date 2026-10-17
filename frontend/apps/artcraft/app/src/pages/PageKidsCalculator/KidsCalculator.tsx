import { useEffect, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";
import {
  DeleteIcon,
  DivideIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  StarIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import {
  calculatorReducer,
  initialCalculatorState,
  type CalculatorAction,
  type CalculatorOperator,
} from "./calculator";
import "./kids-calculator.css";

const operatorIcons = {
  "+": PlusIcon,
  "-": MinusIcon,
  "×": XIcon,
  "÷": DivideIcon,
} satisfies Record<CalculatorOperator, LucideIcon>;

export const KidsCalculator = () => {
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement) {
        if (
          event.target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) ||
          (event.target.tagName === "BUTTON" &&
            (event.key === "Enter" || event.key === " "))
        ) {
          return;
        }
      }
      const action = keyboardAction(event.key);
      if (!action) return;
      event.preventDefault();
      dispatch(action);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="kids-calc-page">
      <div className="kids-calc-confetti" aria-hidden="true">
        <span>✦</span>
        <span>●</span>
        <span>✦</span>
        <span>●</span>
      </div>
      <div className="kids-calc-content">
        <header className="kids-calc-heading">
          <div className="kids-calc-heading-icon" aria-hidden="true">
            <span>＋</span>
          </div>
          <div>
            <p className="kids-calc-eyebrow">
              <SparklesIcon size={14} aria-hidden="true" />
              PLAY &amp; LEARN
            </p>
            <h1>Math is a little adventure!</h1>
            <p className="kids-calc-subtitle">
              Pick some numbers and let’s see what they can do.
            </p>
          </div>
          <div className="kids-calc-sticker" aria-hidden="true">
            <StarIcon size={17} fill="currentColor" />
            <span>YOU’VE<br />GOT THIS!</span>
          </div>
        </header>

        <section className="kids-calc-card" aria-label="Calculator">
          <div className="kids-calc-display">
            <p className="kids-calc-expression" aria-live="polite">
              {state.expression || "Your number goes here"}
            </p>
            <output
              className="kids-calc-number"
              aria-label={`Display: ${state.display}`}
              aria-live="polite"
              aria-atomic="true"
            >
              {formatDisplay(state.display)}
            </output>
            <p className="kids-calc-message" role={state.message ? "alert" : undefined}>
              {state.message || " "}
            </p>
          </div>

          <div
            className="kids-calc-keypad"
            role="group"
            aria-label="Calculator buttons"
          >
            <CalcButton label="Clear" className="utility" onClick={() => dispatch({ type: "clear" })}>
              <RotateCcwIcon size={20} />
              <span>Clear</span>
            </CalcButton>
            <CalcButton label="Backspace" className="utility" onClick={() => dispatch({ type: "backspace" })}>
              <DeleteIcon size={21} />
            </CalcButton>
            <CalcButton label="Percent" className="utility" onClick={() => dispatch({ type: "percent" })}>
              %
            </CalcButton>
            <OperatorButton operator="÷" dispatch={dispatch} />

            <DigitButton digit="7" dispatch={dispatch} />
            <DigitButton digit="8" dispatch={dispatch} />
            <DigitButton digit="9" dispatch={dispatch} />
            <OperatorButton operator="×" dispatch={dispatch} />

            <DigitButton digit="4" dispatch={dispatch} />
            <DigitButton digit="5" dispatch={dispatch} />
            <DigitButton digit="6" dispatch={dispatch} />
            <OperatorButton operator="-" dispatch={dispatch} />

            <DigitButton digit="1" dispatch={dispatch} />
            <DigitButton digit="2" dispatch={dispatch} />
            <DigitButton digit="3" dispatch={dispatch} />
            <OperatorButton operator="+" dispatch={dispatch} />

            <CalcButton label="Change sign" className="utility" onClick={() => dispatch({ type: "sign" })}>
              ±
            </CalcButton>
            <DigitButton digit="0" dispatch={dispatch} wide />
            <CalcButton label="Decimal point" className="digit" onClick={() => dispatch({ type: "decimal" })}>
              .
            </CalcButton>
            <CalcButton label="Equals" className="equals" onClick={() => dispatch({ type: "equals" })}>
              =
            </CalcButton>
          </div>
          <p className="kids-calc-hint">
            <HeartIcon size={14} fill="currentColor" aria-hidden="true" />
            Big buttons for big ideas
          </p>
        </section>

        <p className="kids-calc-keyboard-hint">
          You can use your keyboard too: numbers, <kbd>+</kbd> <kbd>−</kbd>{" "}
          <kbd>×</kbd> <kbd>÷</kbd>, <kbd>Enter</kbd> to solve, and{" "}
          <kbd>Esc</kbd> to start over.
        </p>
      </div>
    </main>
  );
};

function CalcButton({
  label,
  className,
  onClick,
  children,
}: {
  label: string;
  className: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`kids-calc-key ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DigitButton({
  digit,
  dispatch,
  wide = false,
}: {
  digit: string;
  dispatch: Dispatch<CalculatorAction>;
  wide?: boolean;
}) {
  return (
    <CalcButton
      label={digit}
      className={`digit${wide ? " wide" : ""}`}
      onClick={() => dispatch({ type: "digit", digit })}
    >
      {digit}
    </CalcButton>
  );
}

function OperatorButton({
  operator,
  dispatch,
}: {
  operator: CalculatorOperator;
  dispatch: Dispatch<CalculatorAction>;
}) {
  const Icon = operatorIcons[operator];
  return (
    <CalcButton
      label={operator}
      className="operator"
      onClick={() => dispatch({ type: "operator", operator })}
    >
      <Icon size={22} strokeWidth={2.8} />
    </CalcButton>
  );
}

function keyboardAction(key: string): CalculatorAction | null {
  if (/^\d$/.test(key)) return { type: "digit", digit: key };
  if (key === "." || key === ",") return { type: "decimal" };
  if (key === "+" || key === "-") return { type: "operator", operator: key };
  if (key === "*") return { type: "operator", operator: "×" };
  if (key === "/") return { type: "operator", operator: "÷" };
  if (key === "Enter" || key === "=") return { type: "equals" };
  if (key === "Backspace") return { type: "backspace" };
  if (key === "Escape" || key === "Delete") return { type: "clear" };
  if (key === "%") return { type: "percent" };
  return null;
}

function formatDisplay(value: string): string {
  const [integer, decimal] = value.split(".");
  const formattedInteger = Number(integer).toLocaleString("en-US");
  return decimal === undefined ? formattedInteger : `${formattedInteger}.${decimal}`;
}
