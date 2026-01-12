/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import StatsOverview from "@/components/Account/StatsOverview";
import useStats from "@/hooks/data/useStats";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";

// モック
jest.mock("@/hooks/data/useStats");
jest.mock("@/hooks/stores/useColorSchemeStore");
jest.mock("@/components/Account/ContributionHeatmap", () => () => <div data-testid="heatmap" />);

// Recharts のモック
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

describe("StatsOverview", () => {
  const mockStats = {
    streak: 5,
    hourly_activity: [
      { hour: 10, count: 5 },
      { hour: 20, count: 10 },
    ],
    genre_stats: [
      { genre: "Pop", count: 20 },
      { genre: "Rock", count: 10 },
    ],
    weekly_activity: [
      { day_of_week: 1, count: 15 }, // 月曜
    ],
    top_songs: [{}, {}, {}], // 3曲
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useColorSchemeStore as unknown as jest.Mock).mockReturnValue({
      getColorScheme: () => ({ colors: { accentFrom: "#fff", primary: "#000" } }),
      hasHydrated: true,
    });
  });

  it("shows loading state", () => {
    (useStats as jest.Mock).mockReturnValue({ stats: null, isLoading: true });
    
    render(<StatsOverview />);
    
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders statistics when loaded", () => {
    (useStats as jest.Mock).mockReturnValue({ stats: mockStats, isLoading: false });
    
    render(<StatsOverview />);
    
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("5日")).toBeInTheDocument();
    expect(screen.getByText("Pop")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    
    expect(screen.getByTestId("heatmap")).toBeInTheDocument();
    // チャートがレンダリングされているか
    expect(screen.getAllByTestId("responsive-container").length).toBeGreaterThan(0);
  });

  it("changes period when clicking buttons", () => {
    const mockUseStats = useStats as jest.Mock;
    mockUseStats.mockReturnValue({ stats: mockStats, isLoading: false });
    
    render(<StatsOverview />);
    
    const monthButton = screen.getByText("月間");
    fireEvent.click(monthButton);
    
    expect(mockUseStats).toHaveBeenCalledWith("month");
  });
});