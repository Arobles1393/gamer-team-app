import { renderHook, act } from "@testing-library/react";
import { useVisibleInterval } from "./useVisibleInterval";

const setVisibility = (state) => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useVisibleInterval", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setVisibility("visible");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("llama al montar y en cada intervalo con la pestaña visible", () => {
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));
    expect(callback).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(3000));
    expect(callback).toHaveBeenCalledTimes(4);
  });

  test("con la pestaña oculta no llama", () => {
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));
    act(() => setVisibility("hidden"));
    act(() => jest.advanceTimersByTime(10000));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("al volver llama de inmediato si ya pasó el intervalo, y sigue", () => {
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));
    act(() => setVisibility("hidden"));
    act(() => jest.advanceTimersByTime(5000));
    act(() => setVisibility("visible"));
    expect(callback).toHaveBeenCalledTimes(2);
    act(() => jest.advanceTimersByTime(1000));
    expect(callback).toHaveBeenCalledTimes(3);
  });

  test("al volver antes del intervalo no repite la llamada", () => {
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));
    act(() => setVisibility("hidden"));
    act(() => jest.advanceTimersByTime(300));
    act(() => setVisibility("visible"));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("montado con la pestaña oculta espera a que se vea", () => {
    setVisibility("hidden");
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));
    act(() => jest.advanceTimersByTime(5000));
    expect(callback).not.toHaveBeenCalled();
    act(() => setVisibility("visible"));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("enabled false no llama nunca", () => {
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000, false));
    act(() => jest.advanceTimersByTime(5000));
    expect(callback).not.toHaveBeenCalled();
  });

  test("al cambiar el callback empieza de nuevo con una llamada inmediata", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ cb }) => useVisibleInterval(cb, 1000), { initialProps: { cb: first } });
    rerender({ cb: second });
    expect(second).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(1000));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  test("al desmontar deja de llamar y quita el listener", () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useVisibleInterval(callback, 1000));
    unmount();
    act(() => jest.advanceTimersByTime(5000));
    act(() => setVisibility("visible"));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
