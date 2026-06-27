import {
  colorSchemes,
  getColorSchemeById,
  DEFAULT_COLOR_SCHEME_ID,
} from "@/constants/colorSchemes";

describe("constants/colorSchemes", () => {
  describe("colorSchemes", () => {
    it("should have 7 schemes", () => {
      expect(colorSchemes).toHaveLength(7);
    });

    it("each scheme should have valid structure", () => {
      colorSchemes.forEach((scheme) => {
        expect(scheme).toHaveProperty("id");
        expect(scheme).toHaveProperty("name");
        expect(scheme).toHaveProperty("description");
        expect(scheme).toHaveProperty("colors");
        expect(scheme).toHaveProperty("previewGradient");

        const { colors } = scheme;
        expect(colors).toHaveProperty("accentFrom");
        expect(colors).toHaveProperty("accentVia");
        expect(colors).toHaveProperty("accentTo");
        expect(colors).toHaveProperty("primary");
        expect(colors).toHaveProperty("scrollbar");
        expect(colors).toHaveProperty("activeTab");
        expect(colors).toHaveProperty("glow");
        expect(colors).toHaveProperty("theme300");
        expect(colors).toHaveProperty("theme400");
        expect(colors).toHaveProperty("theme500");
        expect(colors).toHaveProperty("theme600");
        expect(colors).toHaveProperty("theme900");
      });
    });

    it("each scheme should have unique ids", () => {
      const ids = colorSchemes.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("should include expected theme IDs", () => {
      const ids = colorSchemes.map((s) => s.id);
      expect(ids).toContain("violet");
      expect(ids).toContain("emerald");
      expect(ids).toContain("rose");
      expect(ids).toContain("amber");
      expect(ids).toContain("sky");
      expect(ids).toContain("monochrome");
      expect(ids).toContain("cyberpunk");
    });

    it("cyberpunk should have neon colors", () => {
      const cyberpunk = colorSchemes.find((s) => s.id === "cyberpunk")!;
      expect(cyberpunk.colors.accentFrom).toBe("#ff00ff");
      expect(cyberpunk.colors.accentVia).toBe("#00ffff");
      expect(cyberpunk.colors.accentTo).toBe("#ffff00");
    });
  });

  describe("getColorSchemeById", () => {
    it("should return matching scheme", () => {
      const scheme = getColorSchemeById("emerald");
      expect(scheme.id).toBe("emerald");
      expect(scheme.name).toBe("エメラルド");
    });

    it("should fall back to first scheme for unknown id", () => {
      const scheme = getColorSchemeById("nonexistent");
      expect(scheme.id).toBe("violet");
    });

    it("DEFAULT_COLOR_SCHEME_ID should be cyberpunk", () => {
      expect(DEFAULT_COLOR_SCHEME_ID).toBe("cyberpunk");
    });
  });
});
