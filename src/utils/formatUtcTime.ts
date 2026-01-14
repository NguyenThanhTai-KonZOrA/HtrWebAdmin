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

  static formatTime(dateStr?: string) {
    if (!dateStr) return "";
    if (dateStr === "0001-01-01T00:00:00") return "-";

    // Clean up the date string - remove milliseconds if present
    let cleanDateStr = dateStr.split('.')[0];

    // Server returns UTC time without 'Z' suffix, so we need to explicitly treat it as UTC
    let utcDateStr = cleanDateStr;

    // Parse as UTC and convert to local time
    const d = new Date(utcDateStr);
    if (isNaN(d.getTime())) return "";

    // Format in local time (JavaScript automatically converts UTC to local)
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }

  static formatDateWithoutTime(dateStr?: string) {
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

    return `${day}/${month}/${year}`;
  }

  // Get today's date in YYYY-MM-DD format for max date validation
  static getTodayString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  static GetTodayVietNamString = (): string => {
    // Set to today in local time
    const date = new Date();
    date.setDate(date.getDate());
    // Format to local datetime-local format (YYYY-MM-DDTHH:mm)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  static GetTomorrowVietNamString(dateString: string) {
    // Set to tomorrow in local time
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    // Format to local datetime-local format (YYYY-MM-DDTHH:mm)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date to dd-MMM-yyyy format (e.g., 26-Dec-2025 12:30:45 PM)
  static formatDateDDMMMYYYY(dateStr?: string | Date): string {
    if (!dateStr) return "";

    let d: Date;

    if (typeof dateStr === 'string') {
      if (dateStr === "0001-01-01T00:00:00") return "-";

      // Clean up the date string - remove milliseconds if present
      let cleanDateStr = dateStr.split('.')[0];

      // Replace space with 'T' if needed for ISO format
      // if (cleanDateStr.includes(' ') && !cleanDateStr.includes('T')) {
      //   cleanDateStr = cleanDateStr.replace(' ', 'T');
      // }

      // Server returns UTC time without 'Z' suffix, so we need to explicitly treat it as UTC
      let utcDateStr = cleanDateStr;

      // If the date string doesn't end with 'Z' or have timezone info, append 'Z' to indicate UTC
      // if (!cleanDateStr.endsWith('Z') && !cleanDateStr.includes('+') && !cleanDateStr.includes('-', 10)) {
      //   utcDateStr = cleanDateStr + 'Z';
      // }

      d = new Date(utcDateStr);
    } else {
      d = dateStr;
    }

    if (isNaN(d.getTime())) return "";

    // Month names in short format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = String(d.getDate()).padStart(2, "0");
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    
    // Convert to 12-hour format with AM/PM
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12 for midnight
    const hoursStr = String(hours).padStart(2, "0");
    
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    
    return `${day}-${month}-${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
  }

  // Format date to dd-MMM-yyyy format (e.g., 26-Dec-2025)
  static formatDateDDMMMYYYYWithoutTime(dateStr?: string | Date): string {
    if (!dateStr) return "";

    let d: Date;

    if (typeof dateStr === 'string') {
      if (dateStr === "0001-01-01T00:00:00") return "-";

      // Clean up the date string - remove milliseconds if present
      let cleanDateStr = dateStr.split('.')[0];

      // Replace space with 'T' if needed for ISO format
      // if (cleanDateStr.includes(' ') && !cleanDateStr.includes('T')) {
      //   cleanDateStr = cleanDateStr.replace(' ', 'T');
      // }

      // Server returns UTC time without 'Z' suffix, so we need to explicitly treat it as UTC
      let utcDateStr = cleanDateStr;

      // If the date string doesn't end with 'Z' or have timezone info, append 'Z' to indicate UTC
      // if (!cleanDateStr.endsWith('Z') && !cleanDateStr.includes('+') && !cleanDateStr.includes('-', 10)) {
      //   utcDateStr = cleanDateStr + 'Z';
      // }

      d = new Date(utcDateStr);
    } else {
      d = dateStr;
    }

    if (isNaN(d.getTime())) return "";

    // Month names in short format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = String(d.getDate()).padStart(2, "0");
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
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