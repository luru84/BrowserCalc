"""
Sequential calculator core logic.

This module implements the stateful calculator described in the design docs:
- sequential (standard) calculation model
- basic operators (+, -, *, /)
- repeated equals
- sign toggle
- clear / clear entry / backspace
- simple error handling (division by zero, invalid input)

Precision-specific logic (percent, tax, advanced rounding) will be layered on later tasks.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, getcontext
from typing import Optional


# Use a generous context; precision-specific rounding is handled separately.
getcontext().prec = 28

MAX_DIGITS = 12  # integer digit limit


@dataclass
class ErrorState:
    code: str
    message: str


class Calculator:
    def __init__(self) -> None:
        self.clear()

    def input_digit(self, digit: str) -> None:
        if self._is_error():
            return
        if digit not in "0123456789":
            self._set_error("INVALID_TOKEN", "Invalid digit")
            return

        if self.new_input:
            self.display_value = digit if digit != "0" else "0"
            self.new_input = False
        else:
            if self._digit_count(self.display_value) >= MAX_DIGITS:
                return
            if self.display_value == "0":
                self.display_value = digit
            else:
                self.display_value += digit

    def input_decimal_point(self) -> None:
        if self._is_error():
            return
        if self.new_input:
            self.display_value = "0."
            self.new_input = False
            return
        if "." not in self.display_value:
            self.display_value += "."

    def toggle_sign(self) -> None:
        if self._is_error():
            return
        if self.display_value.startswith("-"):
            self.display_value = self.display_value[1:]
        else:
            if self.display_value != "0":
                self.display_value = f"-{self.display_value}"

    def backspace(self) -> None:
        if self._is_error():
            return
        if self.new_input:
            return
        if len(self.display_value) <= 1 or (len(self.display_value) == 2 and self.display_value.startswith("-")):
            self.display_value = "0"
            self.new_input = True
        else:
            self.display_value = self.display_value[:-1]

    def clear_entry(self) -> None:
        if self._is_error():
            self.clear()
            return
        self.display_value = "0"
        self.new_input = True

    def clear(self) -> None:
        self.display_value: str = "0"
        self.accumulator: Optional[Decimal] = None
        self.pending_operator: Optional[str] = None
        self.recent_operand: Optional[Decimal] = None
        self.new_input: bool = True
        self.error: Optional[ErrorState] = None

    def set_operator(self, operator: str) -> None:
        if self._is_error():
            return
        if operator not in {"+", "-", "*", "/"}:
            self._set_error("INVALID_TOKEN", "Invalid operator")
            return

        current_value = self._to_decimal(self.display_value)
        if current_value is None:
            return

        if self.pending_operator is not None and self.accumulator is not None and not self.new_input:
            result = self._apply_operator(self.accumulator, current_value, self.pending_operator)
            if result is None:
                return
            self.accumulator = result
            self.display_value = self._format(result)
        elif self.accumulator is None:
            self.accumulator = current_value

        self.pending_operator = operator
        self.recent_operand = None
        self.new_input = True

    def equals(self) -> None:
        if self._is_error():
            return
        if self.pending_operator is None or self.accumulator is None:
            # nothing to do
            self.accumulator = self._to_decimal(self.display_value)
            self.new_input = True
            return

        operand = None
        if not self.new_input:
            operand = self._to_decimal(self.display_value)
            self.recent_operand = operand
        else:
            operand = self.recent_operand or self.accumulator

        if operand is None:
            return

        result = self._apply_operator(self.accumulator, operand, self.pending_operator)
        if result is None:
            return

        self.accumulator = result
        self.display_value = self._format(result)
        self.new_input = True

    def get_display(self) -> str:
        if self._is_error():
            return self.error.message
        return self.display_value

    # Internal helpers

    def _apply_operator(self, left: Decimal, right: Decimal, operator: str) -> Optional[Decimal]:
        try:
            if operator == "+":
                return left + right
            if operator == "-":
                return left - right
            if operator == "*":
                return left * right
            if operator == "/":
                if right == 0:
                    self._set_error("DIV_ZERO", "Cannot divide by zero")
                    return None
                return left / right
        except InvalidOperation:
            self._set_error("OVERFLOW", "Overflow")
            return None
        self._set_error("INVALID_TOKEN", "Invalid operator")
        return None

    def _to_decimal(self, value: str) -> Optional[Decimal]:
        try:
            return Decimal(value)
        except InvalidOperation:
            self._set_error("INVALID_TOKEN", "Invalid number")
            return None

    def _format(self, value: Decimal) -> str:
        # Normalize to plain string, strip trailing zeros.
        as_str = format(value, "f")
        if "." in as_str:
            as_str = as_str.rstrip("0").rstrip(".")
        return as_str if as_str else "0"

    def _digit_count(self, value: str) -> int:
        return sum(1 for ch in value if ch.isdigit())

    def _set_error(self, code: str, message: str) -> None:
        self.error = ErrorState(code=code, message=message)
        self.display_value = message
        self.pending_operator = None
        self.accumulator = None
        self.recent_operand = None
        self.new_input = True

    def _is_error(self) -> bool:
        return self.error is not None

