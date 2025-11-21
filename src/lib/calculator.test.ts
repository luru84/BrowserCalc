import { expect, test } from "vitest";
import {
  CalculatorState,
  backspace,
  clearAll,
  clearEntry,
  createInitialState,
  equals,
  inputDecimal,
  inputDigit,
  setOperator,
  toggleSign,
} from "./calculator";

const enterNumber = (state: CalculatorState, text: string): CalculatorState => {
  let s = state;
  for (const ch of text) {
    s = ch === "." ? inputDecimal(s) : inputDigit(s, ch);
  }
  return s;
};

test("basic addition", () => {
  let s = createInitialState();
  s = enterNumber(s, "12");
  s = setOperator(s, "+");
  s = enterNumber(s, "3");
  s = equals(s);
  expect(s.displayValue).toBe("15");
});

test("repeated equals reapplies operand", () => {
  let s = createInitialState();
  s = enterNumber(s, "5");
  s = setOperator(s, "+");
  s = enterNumber(s, "2");
  s = equals(s);
  expect(s.displayValue).toBe("7");
  s = equals(s);
  expect(s.displayValue).toBe("9");
  s = equals(s);
  expect(s.displayValue).toBe("11");
});

test("clear entry keeps pending operator", () => {
  let s = createInitialState();
  s = enterNumber(s, "5");
  s = setOperator(s, "+");
  s = enterNumber(s, "9");
  s = clearEntry(s);
  s = enterNumber(s, "3");
  s = equals(s);
  expect(s.displayValue).toBe("8");
});

test("backspace edits current input", () => {
  let s = createInitialState();
  s = enterNumber(s, "123");
  s = backspace(s);
  expect(s.displayValue).toBe("12");
  s = backspace(s);
  expect(s.displayValue).toBe("1");
  s = backspace(s);
  expect(s.displayValue).toBe("0");
});

test("toggle sign", () => {
  let s = createInitialState();
  s = enterNumber(s, "5");
  s = toggleSign(s);
  expect(s.displayValue).toBe("-5");
  s = toggleSign(s);
  expect(s.displayValue).toBe("5");
});

test("divide by zero sets error and clear recovers", () => {
  let s = createInitialState();
  s = enterNumber(s, "8");
  s = setOperator(s, "/");
  s = enterNumber(s, "0");
  s = equals(s);
  expect(s.error?.code).toBe("DIV_ZERO");
  s = clearAll(s);
  expect(s.displayValue).toBe("0");
  expect(s.error).toBeNull();
});

test("digit limit enforced", () => {
  let s = createInitialState();
  s = enterNumber(s, "1234567890123"); // 13 digits
  const digitCount = (s.displayValue.match(/[0-9]/g) || []).length;
  expect(digitCount).toBe(12);
});

test("rounds to default precision (3 decimals)", () => {
  let s = createInitialState();
  s = enterNumber(s, "1");
  s = setOperator(s, "/");
  s = enterNumber(s, "3");
  s = equals(s);
  expect(s.displayValue).toBe("0.333");
});
