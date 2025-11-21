import { expect, test } from "vitest";
import {
  CalculatorState,
  applyPercent,
  applyTaxExcluded,
  applyTaxIncluded,
  backspace,
  clearAll,
  clearEntry,
  createInitialState,
  equals,
  inputDecimal,
  inputDigit,
  memoryAdd,
  memoryClear,
  memoryRecall,
  memoryStore,
  memorySubtract,
  setOperator,
  toggleMode,
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

test("percent applies sequential model examples", () => {
  let s = createInitialState();
  s = enterNumber(s, "200");
  s = setOperator(s, "+");
  s = enterNumber(s, "10");
  s = applyPercent(s); // 10% of 200 => 20
  s = equals(s);
  expect(s.displayValue).toBe("220");

  s = createInitialState();
  s = enterNumber(s, "200");
  s = setOperator(s, "*");
  s = enterNumber(s, "10");
  s = applyPercent(s); // 10% => 0.1
  s = equals(s);
  expect(s.displayValue).toBe("20");
});

test("tax inclusive/exclusive rounds to 2 decimals", () => {
  let s = createInitialState();
  s = enterNumber(s, "100");
  s = applyTaxIncluded(s); // 110.00 -> 110
  expect(s.displayValue).toBe("110");

  s = applyTaxExcluded(s); // back to 100.00 -> 100
  expect(s.displayValue).toBe("100");
});

test("decimal input is limited to 4th place", () => {
  let s = createInitialState();
  s = enterNumber(s, "1");
  s = inputDecimal(s);
  s = enterNumber(s, "2345");
  s = enterNumber(s, "6"); // should be ignored (over 4 decimals)
  expect(s.displayValue).toBe("1.2345");
});

test("memory operations store/recall/add/subtract", () => {
  let s = createInitialState();
  s = enterNumber(s, "10");
  s = memoryStore(s);
  s = memoryRecall(s);
  expect(s.displayValue).toBe("10");
  s = enterNumber(s, "5");
  s = memoryAdd(s); // 10 + 5
  s = memoryRecall(s);
  expect(s.displayValue).toBe("15");
  s = enterNumber(s, "3");
  s = memorySubtract(s); // 15 - 3
  s = memoryRecall(s);
  expect(s.displayValue).toBe("12");
  s = memoryClear(s);
  expect(s.memoryValue).toBeNull();
  s = clearAll(s);
  expect(s.memoryValue).toBeNull();
});

test("expression mode basic evaluation", () => {
  let s = createInitialState();
  s = toggleMode(s, "expression");
  s = enterNumber(s, "2");
  s = setOperator(s, "+");
  s = enterNumber(s, "3");
  s = setOperator(s, "*");
  s = enterNumber(s, "4");
  s = equals(s); // 2 + 3 * 4 = 14
  expect(s.displayValue).toBe("14");
});

test("overflow raises an error and requires reset", () => {
  let s = createInitialState();
  s = enterNumber(s, "999999999999");
  s = setOperator(s, "+");
  s = enterNumber(s, "1");
  s = equals(s);
  expect(s.error?.code).toBe("OVERFLOW");
  expect(s.displayValue).toBe("Overflow");

  s = clearAll(s);
  expect(s.displayValue).toBe("0");
  expect(s.error).toBeNull();
});

test("overflow from very large results uses magnitude", () => {
  let s = createInitialState();
  s = enterNumber(s, "999999999999");
  s = setOperator(s, "*");
  s = enterNumber(s, "1000");
  s = equals(s);
  expect(s.error?.code).toBe("OVERFLOW");
  expect(s.displayValue).toBe("Overflow");
});
