export type CalculatorOperator = "+" | "-" | "×" | "÷";

export interface CalculatorState {
  display: string;
  storedValue: number | null;
  pendingOperator: CalculatorOperator | null;
  waitingForOperand: boolean;
  lastOperator: CalculatorOperator | null;
  lastOperand: number | null;
  expression: string;
  message: string;
}

export type CalculatorAction =
  | { type: "digit"; digit: string }
  | { type: "decimal" }
  | { type: "operator"; operator: CalculatorOperator }
  | { type: "equals" }
  | { type: "clear" }
  | { type: "backspace" }
  | { type: "sign" }
  | { type: "percent" };

export const initialCalculatorState: CalculatorState = {
  display: "0",
  storedValue: null,
  pendingOperator: null,
  waitingForOperand: false,
  lastOperator: null,
  lastOperand: null,
  expression: "",
  message: "",
};

const MAX_INPUT_LENGTH = 12;

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  switch (action.type) {
    case "digit": {
      if (!/^\d$/.test(action.digit)) return state;
      const startsNewNumber = state.waitingForOperand || !!state.message;
      const current = startsNewNumber ? "" : state.display;
      if (
        current !== "0" &&
        current.replace(/[-.]/g, "").length >= MAX_INPUT_LENGTH
      ) {
        return { ...state, message: "That's a big number! Try up to 12 digits." };
      }
      const next = current === "0" ? action.digit : `${current}${action.digit}`;
      return {
        ...state,
        display: next || action.digit,
        waitingForOperand: false,
        lastOperator: startsNewNumber ? null : state.lastOperator,
        lastOperand: startsNewNumber ? null : state.lastOperand,
        message: "",
      };
    }
    case "decimal": {
      const startsNewNumber = state.waitingForOperand || !!state.message;
      if (!startsNewNumber && state.display.includes(".")) return state;
      return {
        ...state,
        display: startsNewNumber ? "0." : `${state.display}.`,
        waitingForOperand: false,
        message: "",
        lastOperator: startsNewNumber ? null : state.lastOperator,
        lastOperand: startsNewNumber ? null : state.lastOperand,
      };
    }
    case "operator": {
      if (state.message) return state;
      const value = Number(state.display);
      if (state.pendingOperator && !state.waitingForOperand) {
        const result = calculate(
          state.storedValue ?? 0,
          value,
          state.pendingOperator,
        );
        if (typeof result !== "number") return calculationError(state, result);
        return {
          ...state,
          display: formatResult(result),
          storedValue: result,
          pendingOperator: action.operator,
          waitingForOperand: true,
          expression: `${formatResult(result)} ${action.operator}`,
          lastOperator: null,
          lastOperand: null,
        };
      }
      return {
        ...state,
        storedValue: value,
        pendingOperator: action.operator,
        waitingForOperand: true,
        expression: `${formatResult(value)} ${action.operator}`,
        lastOperator: null,
        lastOperand: null,
      };
    }
    case "equals": {
      if (state.message) return state;
      const operator = state.pendingOperator ?? state.lastOperator;
      const left = state.pendingOperator
        ? state.storedValue
        : Number(state.display);
      const right = state.pendingOperator
        ? Number(state.display)
        : state.lastOperand;
      if (!operator || left === null || right === null) return state;

      const result = calculate(left, right, operator);
      if (typeof result !== "number") return calculationError(state, result);
      return {
        ...state,
        display: formatResult(result),
        storedValue: null,
        pendingOperator: null,
        waitingForOperand: true,
        lastOperator: operator,
        lastOperand: right,
        expression: `${formatResult(left)} ${operator} ${formatResult(right)} =`,
        message: "",
      };
    }
    case "clear":
      return initialCalculatorState;
    case "backspace": {
      if (state.message) return initialCalculatorState;
      if (state.waitingForOperand) {
        return {
          ...state,
          display: "0",
          waitingForOperand: false,
          lastOperator: null,
          lastOperand: null,
        };
      }
      const shortened = state.display.slice(0, -1);
      return {
        ...state,
        display:
          shortened === "" || shortened === "-" || shortened === "-0"
            ? "0"
            : shortened,
      };
    }
    case "sign":
      if (state.message || Number(state.display) === 0) return state;
      return {
        ...state,
        display: state.display.startsWith("-")
          ? state.display.slice(1)
          : `-${state.display}`,
      };
    case "percent":
      if (state.message) return state;
      return {
        ...state,
        display: formatResult(Number(state.display) / 100),
        waitingForOperand: false,
      };
  }
}

function calculate(
  left: number,
  right: number,
  operator: CalculatorOperator,
): number | "division-by-zero" | "number-too-large" {
  if (operator === "÷" && right === 0) return "division-by-zero";
  const result =
    operator === "+"
      ? left + right
      : operator === "-"
        ? left - right
        : operator === "×"
          ? left * right
          : left / right;
  return Number.isFinite(result) ? result : "number-too-large";
}

function calculationError(
  state: CalculatorState,
  error: "division-by-zero" | "number-too-large",
): CalculatorState {
  return {
    ...state,
    display: "0",
    storedValue: null,
    pendingOperator: null,
    waitingForOperand: false,
    lastOperator: null,
    lastOperand: null,
    expression: "",
    message:
      error === "division-by-zero"
        ? "Oops! We can't divide by zero."
        : "That's a super-big number. Try a smaller one!",
  };
}

function formatResult(value: number): string {
  return String(Number(value.toPrecision(10)));
}
