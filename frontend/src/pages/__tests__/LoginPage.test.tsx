import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "../LoginPage";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../store/slices/authSlice";
import { AuthProvider } from "../../context/AuthContext";

// Mock child components to avoid issues with specialized libraries like GSAP
vi.mock("gsap", () => ({
  gsap: {
    to: vi.fn(),
    from: vi.fn(),
    fromTo: vi.fn(),
    set: vi.fn(),
    timeline: () => ({ to: vi.fn(), from: vi.fn(), fromTo: vi.fn() }),
  },
}));

// Mock child components
vi.mock("../../components/SettingsMenu", () => ({
  default: () => <div data-testid="settings-menu">Settings</div>,
}));
vi.mock("lucide-react", () => ({
  ChefHat: () => <div />,
  Lock: () => <div />,
  Mail: () => <div />,
  Loader2: () => <div />,
  Eye: () => <div />,
  EyeOff: () => <div />,
}));

vi.mock("../../components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, id }: any) => (
    <input
      data-testid={`input-${id}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      id={id}
    />
  ),
}));

vi.mock("../../components/LoadingButton", () => ({
  default: ({ onClick, children, isLoading }: any) => (
    <button onClick={onClick} disabled={isLoading} data-testid="submit-button">
      {isLoading ? "Loading..." : children}
    </button>
  ),
}));

// Mock translation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithProviders = (component: React.ReactNode) => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
  });

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>{component}</AuthProvider>
      </BrowserRouter>
    </Provider>,
  );
};

describe("LoginPage", () => {
  it("renders login form", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByTestId("input-email")).toBeInTheDocument();
  });

  it("updates input fields", () => {
    renderWithProviders(<LoginPage />);
    const emailInput = screen.getByTestId("input-email") as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");
  });
});
