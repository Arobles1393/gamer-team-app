// i18n.js usa require.context (solo existe en webpack): se reemplaza por un
// idioma controlable y t() que devuelve la clave con sus valores
let mockLocale = "es-MX";
jest.mock("../i18n", () => ({
  __esModule: true,
  default: { t: (key, values) => (values ? `${key}|${JSON.stringify(values)}` : key) },
  getIntlLocale: () => mockLocale
}));

// eslint-disable-next-line import/first
import { formatDates } from "./formatDates";

// Miércoles 10 de septiembre de 2025, 14:30 hora local
const NOW = new Date(2025, 8, 10, 14, 30, 0);
const ago = (ms) => new Date(NOW.getTime() - ms);
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatDates", () => {
  beforeEach(() => {
    mockLocale = "es-MX";
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("toDate", () => {
    test("acepta Timestamp de Firestore, {seconds}, Date, número y texto", () => {
      const date = new Date(2025, 0, 2);
      expect(formatDates.toDate({ toDate: () => date })).toBe(date);
      expect(formatDates.toDate({ seconds: date.getTime() / 1000 }).getTime()).toBe(date.getTime());
      expect(formatDates.toDate(date).getTime()).toBe(date.getTime());
      expect(formatDates.toDate(date.getTime()).getTime()).toBe(date.getTime());
      expect(formatDates.toDate("2025-01-02T00:00:00").getTime()).toBe(date.getTime());
    });

    test("vacío o inválido: null (y los formatos devuelven texto vacío)", () => {
      expect(formatDates.toDate(null)).toBeNull();
      expect(formatDates.toDate(undefined)).toBeNull();
      expect(formatDates.toDate("no es fecha")).toBeNull();
      expect(formatDates.formatDate("no es fecha")).toBe("");
      expect(formatDates.formatDateN(null)).toBe("");
      expect(formatDates.formatChatTime(null)).toBe("");
      expect(formatDates.formatMessageTime(null)).toBe("");
      expect(formatDates.formatScheduledTime(null)).toBe("");
    });
  });

  describe("formatDateN (relativo largo)", () => {
    test("elige la mayor unidad y empieza con mayúscula", () => {
      expect(formatDates.formatDateN(ago(5 * MIN))).toBe("Hace 5 minutos");
      expect(formatDates.formatDateN(ago(3 * HOUR))).toBe("Hace 3 horas");
      expect(formatDates.formatDateN(ago(2 * DAY))).toBe("Anteayer");
      expect(formatDates.formatDateN(ago(14 * DAY))).toBe("Hace 2 semanas");
      expect(formatDates.formatDateN(ago(400 * DAY))).toBe("El año pasado");
    });

    test("menos de un minuto: ahora", () => {
      expect(formatDates.formatDateN(ago(20 * 1000))).toBe("Ahora");
    });

    test("en el idioma actual", () => {
      mockLocale = "en-US";
      expect(formatDates.formatDateN(ago(5 * MIN))).toBe("5 minutes ago");
      mockLocale = "pt-BR";
      expect(formatDates.formatDateN(ago(3 * HOUR))).toBe("Há 3 horas");
    });
  });

  test("formatChatTime: corto, sin \"hace\"", () => {
    mockLocale = "en-US";
    expect(formatDates.formatChatTime(ago(10 * 1000))).toBe("now");
    expect(formatDates.formatChatTime(ago(5 * MIN))).toBe("5m");
    expect(formatDates.formatChatTime(ago(3 * HOUR))).toBe("3h");
    expect(formatDates.formatChatTime(ago(2 * DAY))).toBe("2d");
  });

  test("formatMessageTime: hora si es de hoy, días si es de esta semana, fecha si no", () => {
    expect(formatDates.formatMessageTime(ago(2 * HOUR))).toBe("12:30");
    expect(formatDates.formatMessageTime(ago(3 * DAY))).toBe("Hace 3 días");
    mockLocale = "en-US";
    expect(formatDates.formatMessageTime(ago(30 * DAY))).toBe("Aug 11, 2025");
  });

  test("formatLastSeen: activo, hace cuánto o desconectado", () => {
    expect(formatDates.formatLastSeen(ago(10 * 1000))).toBe("common:presence.activeNow");
    expect(formatDates.formatLastSeen(ago(5 * MIN))).toBe('common:presence.lastSeen|{"time":"hace 5 minutos"}');
    expect(formatDates.formatLastSeen(null)).toBe("common:presence.offline");
  });

  describe("formatScheduledTime (partidas programadas, días de calendario)", () => {
    test("hoy y mañana", () => {
      expect(formatDates.formatScheduledTime(new Date(2025, 8, 10, 20, 0))).toBe("Hoy 20:00");
      // Mañana a las 00:15 es otro día de calendario aunque falten menos de 24 h
      expect(formatDates.formatScheduledTime(new Date(2025, 8, 11, 0, 15))).toBe("Mañana 00:15");
    });

    test("los próximos 6 días con el día de la semana, sin punto", () => {
      expect(formatDates.formatScheduledTime(new Date(2025, 8, 13, 21, 0))).toBe("Sáb 21:00");
      mockLocale = "en-US";
      expect(formatDates.formatScheduledTime(new Date(2025, 8, 13, 21, 0))).toBe("Sat 21:00");
    });

    test("más adelante: día y mes", () => {
      expect(formatDates.formatScheduledTime(new Date(2025, 9, 4, 20, 0))).toBe("4 oct, 20:00");
    });
  });
});
