export function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const start = formatter.format(new Date(startDate));
  const end = formatter.format(new Date(endDate));

  if (start === end) {
    return start;
  }

  return `${start} - ${end}`;
}