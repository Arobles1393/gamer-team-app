import { useCallback, useEffect, useState } from "react";

// Cuenta regresiva en segundos para botones de "enviar otra vez".
// start() la arranca; remaining es 0 cuando ya se puede volver a usar.
export const useCooldown = (seconds = 60) => {
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt <= Date.now()) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const start = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setEndsAt(at + seconds * 1000);
  }, [seconds]);

  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));

  return { remaining, active: remaining > 0, start };
};
