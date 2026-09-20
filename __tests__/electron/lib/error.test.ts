import { getErrorMessage } from "@/electron/lib/error";

describe("electron/lib/error", () => {
  describe("getErrorMessage", () => {
    it("should return error message from Error instance", () => {
      const error = new Error("Something went wrong");
      expect(getErrorMessage(error)).toBe("Something went wrong");
    });

    it("should return fallback for non-Error input", () => {
      expect(getErrorMessage("string error")).toBe("Unknown error");
    });

    it("should return custom fallback for non-Error input", () => {
      expect(getErrorMessage(42, "Custom fallback")).toBe("Custom fallback");
    });

    it("should return fallback for null", () => {
      expect(getErrorMessage(null)).toBe("Unknown error");
    });

    it("should return fallback for undefined", () => {
      expect(getErrorMessage(undefined)).toBe("Unknown error");
    });

    it("should return fallback for object without message", () => {
      expect(getErrorMessage({ foo: "bar" })).toBe("Unknown error");
    });

    it("should return fallback for an empty message", () => {
      expect(getErrorMessage(new Error(""))).toBe("Unknown error");
      expect(getErrorMessage({ message: "" })).toBe("Unknown error");
      expect(getErrorMessage({ message: "   " })).toBe("Unknown error");
    });

    it("should stringify a numeric message", () => {
      expect(getErrorMessage({ message: 404 })).toBe("404");
    });

    it("should return fallback for non string/number messages", () => {
      expect(getErrorMessage({ message: null })).toBe("Unknown error");
      expect(getErrorMessage({ message: undefined })).toBe("Unknown error");
      expect(getErrorMessage({ message: true })).toBe("Unknown error");
      expect(getErrorMessage({ message: { nested: 1 } })).toBe("Unknown error");
    });

    it("should return Error.message even when fallback is provided", () => {
      const error = new Error("Real error");
      expect(getErrorMessage(error, "Fallback")).toBe("Real error");
    });
  });
});
