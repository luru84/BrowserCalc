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
  taxRate: number;
  precision: number;
};

export const MAX_DIGITS = 12;
const DEFAULT_PRECISION = 3;
const MAX_DECIMAL_INPUT = 4; // 入力時の小数桁は第4位まで許可（第4位丸め→第3位表示）
const OVERFLOW_MESSAGE = "Overflow";
export const DEFAULT_TAX_RATE = 0.1;

export function createInitialState(): CalculatorState {
  return {
    displayValue: "0",
    accumulator: null,
    pendingOperator: null,
    recentOperand: null,
    newInput: true,
    error: null,
    taxRate: DEFAULT_TAX_RATE,
    precision: DEFAULT_PRECISION,
  };
}

export function clearAll(_state: CalculatorState): CalculatorState {
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

  if (state.displayValue.includes(".")) {
    const decimals = decimalPlaces(state.displayValue);
    if (decimals >= MAX_DECIMAL_INPUT) return state;
  }

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
    const rounded = roundToPrecision(result, state.precision);
    if (isOverflow(rounded)) return setError(state, "OVERFLOW", OVERFLOW_MESSAGE);
    nextAccumulator = rounded;
    nextDisplay = formatNumber(rounded, state.precision);
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
  const rounded = roundToPrecision(result, state.precision);
  if (isOverflow(rounded)) return setError(state, "OVERFLOW", OVERFLOW_MESSAGE);

  return {
    ...state,
    accumulator: rounded,
    displayValue: formatNumber(rounded, state.precision),
    newInput: true,
    recentOperand: operand,
  };
}

export function applyPercent(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  const current = toNumber(state.displayValue);
  if (current == null) return state;

  let value = current / 100;
  if (state.accumulator != null && state.pendingOperator) {
    // 逐次計算モデル: 加減は acc * (input/100)、乗除は input/100
    if (state.pendingOperator === "+" || state.pendingOperator === "-") {
      value = (state.accumulator * current) / 100;
    }
  }
  const rounded = roundToPrecision(value, state.precision);
  if (isOverflow(rounded)) return setError(state, "OVERFLOW", OVERFLOW_MESSAGE);
  return { ...state, displayValue: formatNumber(rounded, state.precision), newInput: false };
}

export function applyTaxIncluded(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  const current = toNumber(state.displayValue);
  if (current == null) return state;
  const taxed = roundTax(current * (1 + state.taxRate));
  if (isOverflow(taxed)) return setError(state, "OVERFLOW", OVERFLOW_MESSAGE);
  return { ...state, displayValue: formatNumber(taxed, 2), newInput: false };
}

export function applyTaxExcluded(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  const current = toNumber(state.displayValue);
  if (current == null) return state;
  if (state.taxRate === -1) return setError(state, "INVALID_TOKEN", "Invalid tax rate");
  const untaxed = roundTax(current / (1 + state.taxRate));
  if (isOverflow(untaxed)) return setError(state, "OVERFLOW", OVERFLOW_MESSAGE);
  return { ...state, displayValue: formatNumber(untaxed, 2), newInput: false };
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

function formatNumber(value: number, precision = DEFAULT_PRECISION): string {
  const rounded = roundToPrecision(value, precision);
  const asStr = rounded.toFixed(precision);
  return asStr.includes(".") ? asStr.replace(/0+$/, "").replace(/\.$/, "") || "0" : asStr;
}

function countDigits(value: string): number {
  return (value.match(/[0-9]/g) || []).length;
}

function decimalPlaces(value: string): number {
  const match = value.split(".")[1];
  return match ? match.length : 0;
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

function roundToPrecision(value: number, precision = DEFAULT_PRECISION): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function isOverflow(value: number): boolean {
  if (!Number.isFinite(value)) return true;
  const abs = Math.abs(value);
  if (abs === 0) return false;

  const digitCount = Math.floor(Math.log10(abs)) + 1;
  return digitCount > MAX_DIGITS;
}

function roundTax(value: number): number {
  return roundToPrecision(value, 2);
}
