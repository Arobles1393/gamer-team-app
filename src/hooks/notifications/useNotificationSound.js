import { useEffect, useRef } from "react";
import {
  playNotificationSound,
  unlockNotificationSound
} from "../../utils/notificationSound";
import { isNotificationForOpenChat } from "../../utils/openChat";

// Entre dos sonidos: si llegan varias seguidas, suena una sola vez
const MIN_INTERVAL_MS = 1500;

const MESSAGE_TYPES = new Set(["message", "group_message"]);

/**
 * Suena al llegar una notificación nueva (blip para mensajes, campanita para
 * el resto). Recibe la lista de no leídas de useUnreadNotifications:
 * - Las que ya estaban al abrir la app no suenan (se toman como vistas).
 * - Los mensajes del chat que está en pantalla no suenan.
 * - Respeta el interruptor de silencio (utils/notificationSound).
 */
export const useNotificationSound = (user, unread, loaded) => {
  const seenIds = useRef(null);
  const lastPlayedAt = useRef(0);

  // El navegador solo deja sonar audio tras una interacción: se desbloquea
  // con el primer clic o tecla
  useEffect(() => {
    const unlock = () => unlockNotificationSound();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Otra cuenta (o sin sesión): se empieza de cero
  useEffect(() => {
    seenIds.current = null;
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !loaded) return;

    // Primera lista: todo lo que había ya está "visto"
    if (!seenIds.current) {
      seenIds.current = new Set(unread.map((notification) => notification.id));
      return;
    }

    const fresh = unread.filter((notification) => !seenIds.current.has(notification.id));
    fresh.forEach((notification) => seenIds.current.add(notification.id));

    // Con la pestaña a la vista, los mensajes del chat abierto ya se están leyendo
    const pageVisible = document.visibilityState === "visible";
    const audible = fresh.filter(
      (notification) => !(pageVisible && isNotificationForOpenChat(notification))
    );
    if (audible.length === 0) return;

    const now = Date.now();
    if (now - lastPlayedAt.current < MIN_INTERVAL_MS) return;
    lastPlayedAt.current = now;

    const hasMessage = audible.some((notification) => MESSAGE_TYPES.has(notification.type));
    playNotificationSound(hasMessage ? "message" : "default");
  }, [user, unread, loaded]);
};
