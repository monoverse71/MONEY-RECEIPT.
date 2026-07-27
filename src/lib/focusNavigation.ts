import type { KeyboardEvent } from "react";

/**
 * Attach to a parent element's onKeyDown. When Enter is pressed inside a
 * plain <input> element within that element, moves focus to the next
 * <input> in DOM order (the same order Tab already uses) instead of doing
 * nothing/submitting. Does not touch Tab behavior, Select/Button Enter
 * handling, or any other keys - only Enter, only on <input> elements.
 */
export function focusNextInputOnEnter(e: KeyboardEvent<HTMLElement>): void {
  if (e.key !== "Enter") return;

  const target = e.target as HTMLElement;
  if (target.tagName !== "INPUT") return;

  e.preventDefault();

  const parent = e.currentTarget;
  const inputs = Array.from(parent.querySelectorAll<HTMLInputElement>("input")).filter(
    (el) => !el.disabled && el.tabIndex !== -1 && el.offsetParent !== null
  );

  const currentIndex = inputs.indexOf(target as HTMLInputElement);
  if (currentIndex === -1) return;

  const next = inputs[currentIndex + 1];
  next?.focus();
}
