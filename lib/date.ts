export function getDateString(i = 0) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-based, so we add 1
  const dd = String(today.getDate() + i).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export function dateToRoamDate(year: number, month: number, day: number) {
  const suffix = ["th", "st", "nd", "rd"][day % 10] || "th";
  return `${monthNames[month - 1]} ${day}${suffix}, ${year}`;
}

export function getRoamDateString(i = 0) {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = today.getDate() + i;
  return dateToRoamDate(y, m, d);
}
