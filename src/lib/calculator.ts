export type Operator = "+" | "-" | "*" | "/";

export type ErrorState = {
  code: "DIV_ZERO" | "OVERFLOW" | "INVALID_TOKEN";
  message: string;
};

export type CalculatorState = {
  displayValue: string;
  accumulator: number | null;
  pendingOperator: Operator | null;
  recentOperand: number | null;
  newInput: boolean;
  error: ErrorState | null;
};

export const MAX_DIGITS = 12;

export function createInitialState(): CalculatorState {
  return {
    displayValue: "0",
    accumulator: null,
    pendingOperator: null,
    recentOperand: null,
    newInput: true,
    error: null,
  };
}

export function clearAll(state: CalculatorState): CalculatorState {
  return createInitialState();
}

export function clearEntry(state: CalculatorState): CalculatorState {
  if (state.error) {
    return createInitialState();
  }
  return {
    ...state,
    displayValue: "0",
    newInput: true,
  };
}

export function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.error) return state;
  if (!/^[0-9]$/.test(digit)) {
    return setError(state, "INVALID_TOKEN", "Invalid digit");
  }

  if (state.newInput) {
    return { ...state, displayValue: digit === "0" ? "0" : digit, newInput: false };
  }

  const digits = countDigits(state.displayValue);
  if (digits >= MAX_DIGITS) return state;

  const next = state.displayValue === "0" ? digit : state.displayValue + digit;
  return { ...state, displayValue: next };
}

export function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  if (state.newInput) {
    return { ...state, displayValue: "0.", newInput: false };
  }
  if (!state.displayValue.includes(".")) {
    return { ...state, displayValue: state.displayValue + "." };
  }
  return state;
}

export function toggleSign(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  if (state.displayValue === "0") return state;
  if (state.displayValue.startsWith("-")) {
    return { ...state, displayValue: state.displayValue.slice(1) };
  }
  return { ...state, displayValue: `-${state.displayValue}` };
}

export function backspace(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  if (state.newInput) return state;
  if (state.displayValue.length <= 1 || (state.displayValue.startsWith("-") && state.displayValue.length <= 2)) {
    return { ...state, displayValue: "0", newInput: true };
  }
  return { ...state, displayValue: state.displayValue.slice(0, -1) };
}

export function setOperator(state: CalculatorState, operator: Operator): CalculatorState {
  if (state.error) return state;
  if (!["+", "-", "*", "/"].includes(operator)) {
    return setError(state, "INVALID_TOKEN", "Invalid operator");
  }

  const current = toNumber(state.displayValue);
  if (current == null) return state;

  let nextAccumulator = state.accumulator;
  let nextDisplay = state.displayValue;

  if (state.pendingOperator && state.accumulator != null && !state.newInput) {
    const result = applyOperator(state.accumulator, current, state.pendingOperator);
    if (result == null) return setError(state, "DIV_ZERO", "Cannot divide by zero");
    nextAccumulator = result;
    nextDisplay = formatNumber(result);
  } else if (state.accumulator == null) {
    nextAccumulator = current;
  }

  return {
    ...state,
    accumulator: nextAccumulator,
    pendingOperator: operator,
    recentOperand: null,
    newInput: true,
    displayValue: nextDisplay,
  };
}

export function equals(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  if (state.pendingOperator == null || state.accumulator == null) {
    return { ...state, accumulator: toNumber(state.displayValue), newInput: true };
  }

  let operand: number | null = null;
  if (!state.newInput) {
    operand = toNumber(state.displayValue);
  } else {
    operand = state.recentOperand ?? state.accumulator;
  }
  if (operand == null) return state;

  const result = applyOperator(state.accumulator, operand, state.pendingOperator);
  if (result == null) return setError(state, "DIV_ZERO", "Cannot divide by zero");

  return {
    ...state,
    accumulator: result,
    displayValue: formatNumber(result),
    newInput: true,
    recentOperand: operand,
  };
}

// Helpers

function applyOperator(left: number, right: number, op: Operator): number | null {
  switch (op) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      if (right === 0) return null;
      return left / right;
    default:
      return null;
  }
}

function toNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(value: number): string {
  const asStr = value.toString();
  return asStr.includes(".") ? asStr.replace(/0+$/, "").replace(/\.$/, "") || "0" : asStr;
}

function countDigits(value: string): number {
  return (value.match(/[0-9]/g) || []).length;
}

function setError(state: CalculatorState, code: ErrorState["code"], message: string): CalculatorState {
  return {
    ...state,
    error: { code, message },
    displayValue: message,
    pendingOperator: null,
    accumulator: null,
    recentOperand: null,
    newInput: true,
  };
}
