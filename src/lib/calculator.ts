export type Operator = "+" | "-" | "*" | "/";
export type Mode = "sequential" | "expression";

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
  grouping: boolean;
  scientific: boolean;
  memoryValue: number | null;
  history: { expression: string; result: string }[];
  mode: Mode;
};

export const MAX_DIGITS = 12;
const DEFAULT_PRECISION = 3;
const MAX_DECIMAL_INPUT = 4; // 入力時の小数桁は第4位まで許可（第4位丸め→第3位表示）
const OVERFLOW_MESSAGE = "Overflow";
export const DEFAULT_TAX_RATE = 0.1;
const DEFAULT_GROUPING = true;
const DEFAULT_SCIENTIFIC = false;

type CalculatorOptions = Partial<Pick<CalculatorState, "taxRate" | "precision" | "grouping" | "scientific">>;

export function createInitialState(options: CalculatorOptions = {}): CalculatorState {
  return {
    displayValue: "0",
    accumulator: null,
    pendingOperator: null,
    recentOperand: null,
    newInput: true,
    error: null,
    taxRate: options.taxRate ?? DEFAULT_TAX_RATE,
    precision: options.precision ?? DEFAULT_PRECISION,
    grouping: options.grouping ?? DEFAULT_GROUPING,
    scientific: options.scientific ?? DEFAULT_SCIENTIFIC,
    memoryValue: null,
    history: [],
    mode: "sequential",
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

  if (state.mode === "expression") {
    return { ...state, displayValue: state.displayValue === "0" ? digit : state.displayValue + digit, newInput: false };
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
  if (state.mode === "expression") {
    if (!state.displayValue.includes(".")) {
      return { ...state, displayValue: state.displayValue + ".", newInput: false };
    }
    return state;
  }
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

  if (state.mode === "expression") {
    return { ...state, displayValue: state.displayValue + operator, newInput: false };
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
    nextDisplay = formatNumber(rounded, state.precision, state.grouping, state.scientific);
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
  if (state.mode === "expression") {
    const { result, error } = evaluateExpression(state.displayValue, state);
    if (error) return setError(state, "INVALID_TOKEN", error);
    const rounded = roundToPrecision(result ?? 0, state.precision);
    if (isOverflow(rounded)) return setError(state, "OVERFLOW", OVERFLOW_MESSAGE);
    return pushHistory(
      {
        ...state,
        accumulator: rounded,
        displayValue: formatNumber(rounded, state.precision, state.grouping, state.scientific),
        newInput: true,
        recentOperand: null,
      },
      state.displayValue,
      rounded,
    );
  }
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

  return pushHistory(
    {
      ...state,
      accumulator: rounded,
      displayValue: formatNumber(rounded, state.precision, state.grouping, state.scientific),
      newInput: true,
      recentOperand: operand,
    },
    `${state.accumulator} ${state.pendingOperator} ${operand}`,
    rounded,
  );
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
  return {
    ...state,
    displayValue: formatNumber(rounded, state.precision, state.grouping, state.scientific),
    newInput: false,
  };
}

export function updateSettings(state: CalculatorState, options: CalculatorOptions): CalculatorState {
  return {
    ...state,
    taxRate: options.taxRate ?? state.taxRate,
    precision: options.precision ?? state.precision,
    grouping: options.grouping ?? state.grouping,
    scientific: options.scientific ?? state.scientific,
  };
}

export function pushHistory(state: CalculatorState, expression: string, result: number): CalculatorState {
  const entry = { expression, result: formatNumber(result, state.precision, state.grouping, state.scientific) };
  const nextHistory = [entry, ...state.history].slice(0, 50);
  return { ...state, history: nextHistory };
}

export function applyTaxIncluded(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  const current = toNumber(state.displayValue);
  if (current == null) return state;
  const taxed = roundTax(current * (1 + state.taxRate));
  if (isOverflow(taxed)) return setError(state, "OVERFLOW", OVERFLOW_MESSAGE);
  return {
    ...state,
    displayValue: formatNumber(taxed, 2, state.grouping, state.scientific),
    newInput: false,
  };
}

export function applyTaxExcluded(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  const current = toNumber(state.displayValue);
  if (current == null) return state;
  if (state.taxRate === -1) return setError(state, "INVALID_TOKEN", "Invalid tax rate");
  const untaxed = roundTax(current / (1 + state.taxRate));
  if (isOverflow(untaxed)) return setError(state, "OVERFLOW", OVERFLOW_MESSAGE);
  return {
    ...state,
    displayValue: formatNumber(untaxed, 2, state.grouping, state.scientific),
    newInput: false,
  };
}

export function memoryClear(state: CalculatorState): CalculatorState {
  return { ...state, memoryValue: null };
}

export function memoryRecall(state: CalculatorState): CalculatorState {
  if (state.memoryValue == null) return state;
  return { ...state, displayValue: formatNumber(state.memoryValue, state.precision, state.grouping, state.scientific), newInput: true };
}

export function memoryStore(state: CalculatorState): CalculatorState {
  const value = toNumber(state.displayValue);
  if (value == null) return state;
  return { ...state, memoryValue: value };
}

export function memoryAdd(state: CalculatorState): CalculatorState {
  const value = toNumber(state.displayValue);
  if (value == null) return state;
  return { ...state, memoryValue: (state.memoryValue ?? 0) + value };
}

export function memorySubtract(state: CalculatorState): CalculatorState {
  const value = toNumber(state.displayValue);
  if (value == null) return state;
  return { ...state, memoryValue: (state.memoryValue ?? 0) - value };
}

export function toggleMode(state: CalculatorState, mode: Mode): CalculatorState {
  if (mode === state.mode) return state;
  return { ...state, mode, accumulator: null, pendingOperator: null, recentOperand: null, newInput: true };
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

function formatNumber(
  value: number,
  precision = DEFAULT_PRECISION,
  grouping = DEFAULT_GROUPING,
  scientific = DEFAULT_SCIENTIFIC,
): string {
  const rounded = roundToPrecision(value, precision);
  const abs = Math.abs(rounded);
  const digits = abs === 0 ? 1 : Math.floor(Math.log10(abs)) + 1;

  if (scientific && digits > MAX_DIGITS) {
    return rounded.toExponential(Math.max(0, precision - 1));
  }

  const asStr = rounded.toFixed(precision);
  const trimmed = asStr.includes(".") ? asStr.replace(/0+$/, "").replace(/\.$/, "") || "0" : asStr;

  if (!grouping) return trimmed;
  const [intPart, decPart] = trimmed.split(".");
  const withGrouping = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${withGrouping}.${decPart}` : withGrouping;
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

type EvalResult = { result: number | null; error?: string };

function evaluateExpression(expr: string, _state: CalculatorState): EvalResult {
  const sanitized = expr.replace(/\s+/g, "");
  if (!/^[0-9+\-*/().]+$/.test(sanitized)) {
    return { result: null, error: "Invalid character" };
  }
  const tokens = tokenize(sanitized);
  if (!tokens.length) return { result: null, error: "Empty expression" };
  const rpn = toRPN(tokens);
  if (!rpn) return { result: null, error: "Syntax error" };
  const result = evalRPN(rpn);
  if (result == null) return { result: null, error: "Syntax error" };
  return { result };
}

type Token = number | Operator | "(" | ")";

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let buffer = "";
  for (const ch of expr) {
    if (/[0-9.]/.test(ch)) {
      buffer += ch;
      continue;
    }
    if (buffer) {
      tokens.push(Number(buffer));
      buffer = "";
    }
    if ("+-*/()".includes(ch)) {
      tokens.push(ch as Token);
    }
  }
  if (buffer) tokens.push(Number(buffer));
  return tokens;
}

function toRPN(tokens: Token[]): Token[] | null {
  const output: Token[] = [];
  const ops: Operator[] = [];
  const prec: Record<Operator, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

  for (const t of tokens) {
    if (typeof t === "number") {
      output.push(t);
    } else if (t === "(") {
      ops.push(t as Operator);
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        output.push(ops.pop() as Operator);
      }
      if (!ops.length) return null;
      ops.pop();
    } else {
      while (ops.length && ops[ops.length - 1] !== "(" && prec[ops[ops.length - 1]] >= prec[t]) {
        output.push(ops.pop() as Operator);
      }
      ops.push(t as Operator);
    }
  }
  while (ops.length) {
    const op = ops.pop() as Operator | "(";
    if (op === "(") return null;
    output.push(op);
  }
  return output;
}

function evalRPN(rpn: Token[]): number | null {
  const stack: number[] = [];
  for (const t of rpn) {
    if (typeof t === "number") {
      stack.push(t);
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a == null || b == null) return null;
      const res = applyOperator(a, b, t as Operator);
      if (res == null) return null;
      stack.push(res);
    }
  }
  return stack.length === 1 ? stack[0] : null;
}
