/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import useLatestRef from "@/hooks/utils/useLatestRef";

describe("useLatestRef", () => {
  it("should return a ref with the initial value", () => {
    const { result } = renderHook(() => useLatestRef("initial"));
    expect(result.current.current).toBe("initial");
  });

  it("should update the ref when the value changes", () => {
    const { result, rerender } = renderHook(({ value }) => useLatestRef(value), {
      initialProps: { value: "initial" },
    });

    expect(result.current.current).toBe("initial");

    rerender({ value: "updated" });

    expect(result.current.current).toBe("updated");
  });
});
