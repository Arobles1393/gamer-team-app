import { act, renderHook } from "@testing-library/react";
import { JOINED_MS, useJoinFeedback } from "./useJoinFeedback";

describe("useJoinFeedback", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("unirse: saving mientras guarda, joined al confirmar y vuelve a idle", async () => {
    const { result } = renderHook(() => useJoinFeedback());
    let resolve;
    let promise;
    act(() => {
      promise = result.current.run(false, () => new Promise((r) => { resolve = r; }));
    });
    expect(result.current.phase).toBe("saving");
    await act(async () => {
      resolve(true);
      await promise;
    });
    expect(result.current.phase).toBe("joined");
    act(() => jest.advanceTimersByTime(JOINED_MS));
    expect(result.current.phase).toBe("idle");
  });

  it("salir de la partida no celebra", async () => {
    const { result } = renderHook(() => useJoinFeedback());
    await act(async () => {
      await result.current.run(true, async () => true);
    });
    expect(result.current.phase).toBe("idle");
  });

  it("si no se pudo guardar (false) vuelve a idle sin celebrar", async () => {
    const { result } = renderHook(() => useJoinFeedback());
    let ok;
    await act(async () => {
      ok = await result.current.run(false, async () => false);
    });
    expect(ok).toBe(false);
    expect(result.current.phase).toBe("idle");
  });

  it("si falla con un error vuelve a idle y el error sigue", async () => {
    const { result } = renderHook(() => useJoinFeedback());
    await act(async () => {
      await expect(result.current.run(false, async () => { throw new Error("red"); })).rejects.toThrow("red");
    });
    expect(result.current.phase).toBe("idle");
  });
});
