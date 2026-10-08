import { render, screen } from "@testing-library/react";
// Sin inicializar i18n (usa require.context de webpack): useTranslation
// devuelve las claves, y la prueba no depende de los textos
import ErrorBoundary from "./ErrorBoundary";

let shouldThrow = true;
function Flaky() {
  if (shouldThrow) throw new Error("falla de prueba");
  return <p>contenido</p>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    shouldThrow = true;
    // React y el boundary registran el error a propósito
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test("si el contenido falla, muestra la pantalla de error con sus dos acciones", () => {
    render(<ErrorBoundary resetKey="/a"><Flaky /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.queryByText("contenido")).not.toBeInTheDocument();
  });

  test("sin errores, muestra el contenido", () => {
    shouldThrow = false;
    render(<ErrorBoundary resetKey="/a"><Flaky /></ErrorBoundary>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("al cambiar de ruta (resetKey) vuelve a intentar", () => {
    const { rerender } = render(<ErrorBoundary resetKey="/a"><Flaky /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    shouldThrow = false;
    rerender(<ErrorBoundary resetKey="/b"><Flaky /></ErrorBoundary>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});
