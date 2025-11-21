import pytest

from yourpkg import Calculator


def enter_number(calc: Calculator, text: str) -> None:
    for ch in text:
        if ch == ".":
            calc.input_decimal_point()
        else:
            calc.input_digit(ch)


def test_basic_addition() -> None:
    calc = Calculator()
    enter_number(calc, "12")
    calc.set_operator("+")
    enter_number(calc, "3")
    calc.equals()
    assert calc.get_display() == "15"


def test_repeated_equals_reuses_operand() -> None:
    calc = Calculator()
    enter_number(calc, "5")
    calc.set_operator("+")
    enter_number(calc, "2")
    calc.equals()
    assert calc.get_display() == "7"
    calc.equals()
    assert calc.get_display() == "9"
    calc.equals()
    assert calc.get_display() == "11"


def test_clear_entry_preserves_pending_operator() -> None:
    calc = Calculator()
    enter_number(calc, "5")
    calc.set_operator("+")
    enter_number(calc, "9")
    calc.clear_entry()
    enter_number(calc, "3")
    calc.equals()
    assert calc.get_display() == "8"


def test_backspace_edits_current_input() -> None:
    calc = Calculator()
    enter_number(calc, "123")
    calc.backspace()
    assert calc.get_display() == "12"
    calc.backspace()
    assert calc.get_display() == "1"
    calc.backspace()
    assert calc.get_display() == "0"


def test_toggle_sign() -> None:
    calc = Calculator()
    enter_number(calc, "5")
    calc.toggle_sign()
    assert calc.get_display() == "-5"
    calc.toggle_sign()
    assert calc.get_display() == "5"


def test_divide_by_zero_sets_error_and_clear_recovers() -> None:
    calc = Calculator()
    enter_number(calc, "8")
    calc.set_operator("/")
    enter_number(calc, "0")
    calc.equals()
    assert "divide by zero" in calc.get_display().lower()
    calc.clear()
    assert calc.get_display() == "0"


def test_digit_limit_is_enforced() -> None:
    calc = Calculator()
    enter_number(calc, "1234567890123")  # 13 digits, limit is 12
    assert sum(1 for ch in calc.get_display() if ch.isdigit()) == 12
