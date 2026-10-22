import { renderHook } from "@testing-library/react";
import { useNotificationSound } from "./useNotificationSound";
import { playNotificationSound } from "../../utils/notificationSound";
import { setOpenChat } from "../../utils/openChat";

jest.mock("../../utils/notificationSound", () => ({
  playNotificationSound: jest.fn(),
  unlockNotificationSound: jest.fn()
}));

const user = { uid: "u1" };
const note = (id, type = "comment", relatedId = "x") => ({ id, type, relatedId });

const setup = (initial, loaded = true) =>
  renderHook(
    ({ unread, isLoaded }) => useNotificationSound(user, unread, isLoaded),
    { initialProps: { unread: initial, isLoaded: loaded } }
  );

describe("useNotificationSound", () => {
  let now;

  beforeEach(() => {
    now = 10_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    playNotificationSound.mockClear();
    setOpenChat(null);
  });

  afterEach(() => jest.restoreAllMocks());

  it("no suena por las no leídas que ya estaban al abrir la app", () => {
    setup([note("a"), note("b", "message")]);
    expect(playNotificationSound).not.toHaveBeenCalled();
  });

  it("no hace nada hasta que la lista cargó", () => {
    const { rerender } = setup([], false);
    rerender({ unread: [note("a")], isLoaded: false });
    expect(playNotificationSound).not.toHaveBeenCalled();
  });

  it("campanita para una notificación nueva que no es mensaje", () => {
    const { rerender } = setup([note("a")]);
    rerender({ unread: [note("b", "friend_request"), note("a")], isLoaded: true });
    expect(playNotificationSound).toHaveBeenCalledWith("default");
  });

  it("blip para un mensaje nuevo (1:1 o de grupo)", () => {
    const { rerender } = setup([]);
    rerender({ unread: [note("m1", "message", "chat1")], isLoaded: true });
    expect(playNotificationSound).toHaveBeenLastCalledWith("message");

    now += 5000;
    rerender({ unread: [note("g1", "group_message", "post1"), note("m1", "message", "chat1")], isLoaded: true });
    expect(playNotificationSound).toHaveBeenLastCalledWith("message");
  });

  it("si llegan juntos mensaje y otra cosa, gana el blip", () => {
    const { rerender } = setup([]);
    rerender({ unread: [note("c1", "comment"), note("m1", "message", "chat1")], isLoaded: true });
    expect(playNotificationSound).toHaveBeenCalledTimes(1);
    expect(playNotificationSound).toHaveBeenCalledWith("message");
  });

  it("una ráfaga suena una sola vez", () => {
    const { rerender } = setup([]);
    rerender({ unread: [note("a")], isLoaded: true });
    now += 400;
    rerender({ unread: [note("b"), note("a")], isLoaded: true });
    expect(playNotificationSound).toHaveBeenCalledTimes(1);

    now += 2000;
    rerender({ unread: [note("c"), note("b"), note("a")], isLoaded: true });
    expect(playNotificationSound).toHaveBeenCalledTimes(2);
  });

  it("no suena por mensajes del chat que está abierto", () => {
    setOpenChat({ type: "direct", id: "chat1" });
    const { rerender } = setup([]);
    rerender({ unread: [note("m1", "message", "chat1")], isLoaded: true });
    expect(playNotificationSound).not.toHaveBeenCalled();

    // Otro chat sí suena
    rerender({ unread: [note("m2", "message", "chat2"), note("m1", "message", "chat1")], isLoaded: true });
    expect(playNotificationSound).toHaveBeenCalledWith("message");
  });

  it("no vuelve a sonar por la misma notificación", () => {
    const { rerender } = setup([]);
    rerender({ unread: [note("a")], isLoaded: true });
    now += 5000;
    rerender({ unread: [note("a")], isLoaded: true });
    expect(playNotificationSound).toHaveBeenCalledTimes(1);
  });
});
