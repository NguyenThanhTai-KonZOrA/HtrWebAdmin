export class FormatUtcTime {
    // Converts a UTC date string to local date-time string in "DD/MM/YYYY HH:mm" format
    static formatDateTime(dateStr?: string) {
        if (!dateStr) return "";
        if (dateStr === "0001-01-01T00:00:00") return "-";

        // Clean up the date string - remove milliseconds if present
        let cleanDateStr = dateStr.split('.')[0];

        // Replace space with 'T' if needed for ISO format
        if (cleanDateStr.includes(' ') && !cleanDateStr.includes('T')) {
            cleanDateStr = cleanDateStr.replace(' ', 'T');
        }

        // Server returns UTC time without 'Z' suffix, so we need to explicitly treat it as UTC
        let utcDateStr = cleanDateStr;

        // If the date string doesn't end with 'Z' or have timezone info, append 'Z' to indicate UTC
        if (!cleanDateStr.endsWith('Z') && !cleanDateStr.includes('+') && !cleanDateStr.includes('-', 10)) {
            utcDateStr = cleanDateStr + 'Z';
        }

        // Parse as UTC and convert to local time
        const d = new Date(utcDateStr);
        if (isNaN(d.getTime())) return "";

        // Format in local time (JavaScript automatically converts UTC to local)
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
}

// Enum for ReportPeriodType
export const ReportPeriodType = {
  Daily: 1,
  Weekly: 2,
  Monthly: 3
} as const;

type ReportPeriodTypeValue = typeof ReportPeriodType[keyof typeof ReportPeriodType];

// Utility function to adjust date range by period type
export function adjustDateRangeByPeriodType(
  requestStartDate: Date,
  requestEndDate: Date,
  periodType: ReportPeriodTypeValue
): { startDate: Date; endDate: Date } {
  switch (periodType) {
    case ReportPeriodType.Daily:
      // Use the exact dates provided
      return {
        startDate: new Date(requestStartDate.getFullYear(), requestStartDate.getMonth(), requestStartDate.getDate()),
        endDate: new Date(requestEndDate.getFullYear(), requestEndDate.getMonth(), requestEndDate.getDate())
      };

    case ReportPeriodType.Weekly:
      // Adjust to start of week (Monday) and end of week (Sunday)
      let weekStartDate = new Date(requestStartDate.getFullYear(), requestStartDate.getMonth(), requestStartDate.getDate());
      while (weekStartDate.getDay() !== 1) { // 1 = Monday
        weekStartDate.setDate(weekStartDate.getDate() - 1);
      }

      let weekEndDate = new Date(requestEndDate.getFullYear(), requestEndDate.getMonth(), requestEndDate.getDate());
      while (weekEndDate.getDay() !== 0) { // 0 = Sunday
        weekEndDate.setDate(weekEndDate.getDate() + 1);
      }

      return { startDate: weekStartDate, endDate: weekEndDate };

    case ReportPeriodType.Monthly:
      // Adjust to first day of start month and last day of end month
      const monthStartDate = new Date(requestStartDate.getFullYear(), requestStartDate.getMonth(), 1);
      const monthEndDate = new Date(requestEndDate.getFullYear(), requestEndDate.getMonth() + 1, 0); // Last day of month

      return { startDate: monthStartDate, endDate: monthEndDate };

    default:
      return {
        startDate: new Date(requestStartDate.getFullYear(), requestStartDate.getMonth(), requestStartDate.getDate()),
        endDate: new Date(requestEndDate.getFullYear(), requestEndDate.getMonth(), requestEndDate.getDate())
      };
  }
}