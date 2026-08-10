/**
 * attendanceTimeFormatter.ts
 *
 * Driver Mobile App - Attendance time display formatter.
 * Uses exact 1:1 logic from web DriverMobileLayout.tsx formatTimeLocal
 */

export function formatAttendanceTime(dateInput: string | Date): string {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "--";
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return "--";
  }
}
