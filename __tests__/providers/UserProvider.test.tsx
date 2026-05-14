/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import UserProvider from "@/providers/UserProvider";

jest.mock("@/hooks/auth/useUser", () => ({
  MyUserContextProvider: ({ children, ...props }: any) => (
    <div data-testid="user-context-provider" {...props}>{children}</div>
  ),
}));

describe("UserProvider", () => {
  it("should render MyUserContextProvider with children", () => {
    const { getByTestId, getByText } = render(
      <UserProvider>
        <div>Child Content</div>
      </UserProvider>
    );
    expect(getByTestId("user-context-provider")).toBeInTheDocument();
    expect(getByText("Child Content")).toBeInTheDocument();
  });
});
