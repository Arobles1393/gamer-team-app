import { addLocale } from "primereact/api";

// Calendar de PrimeReact en español: <Calendar locale="es" />
addLocale("es", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["D", "L", "M", "X", "J", "V", "S"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  clear: "Limpiar",
  chooseDate: "Elegir fecha",
  chooseTime: "Elegir hora"
});

export const CALENDAR_LOCALE = "es";
