export const formatDate = (timestamp) => {
  if (!timestamp) return "";

  const date =
    timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

  return date.toLocaleDateString(
    "es-MX",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
};