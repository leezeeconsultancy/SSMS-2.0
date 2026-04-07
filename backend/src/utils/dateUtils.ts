/**
 * Global IST (Asia/Kolkata) Timezone Utilities
 * All functions return UTC Dates that correspond to the correct IST time.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30

/**
 * Gets the current date/time in IST.
 */
export const getISTNow = (): Date => {
    return new Date(); // Internal server time is UTC, we use UTC internally
};

/**
 * Returns IST time components (hours, minutes, etc.) for a given UTC Date.
 */
export const getISTComponents = (date: Date = new Date()) => {
    const istStr = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istStr);
    return {
        hours: istDate.getHours(),
        minutes: istDate.getMinutes(),
        day: istDate.getDay(),
        date: istDate.getDate(),
        month: istDate.getMonth(),
        year: istDate.getFullYear(),
        dateString: `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`,
    };
};

/**
 * Returns a UTC Date representing the START (00:00:00) of an IST day.
 */
export const getISTStartOfDay = (date: Date = new Date()): Date => {
    const components = getISTComponents(date);
    // Create UTC date representing IST midnight
    const utcMidnight = new Date(Date.UTC(components.year, components.month, components.date, 0, 0, 0, 0));
    // Subtract offset to get true UTC equivalent: e.g. 05:30 IST is 00:00 UTC
    // So 00:00 IST is 18:30 UTC of previous day.
    utcMidnight.setTime(utcMidnight.getTime() - IST_OFFSET_MS);
    return utcMidnight;
};

/**
 * Returns a UTC Date representing the END (23:59:59) of an IST day.
 */
export const getISTEndOfDay = (date: Date = new Date()): Date => {
    const start = getISTStartOfDay(date);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
};

/**
 * Returns YYYY-MM-DD string for IST.
 */
export const getTodayStringIST = (date: Date = new Date()): string => {
    return getISTComponents(date).dateString;
};

/**
 * Returns starting and ending UTC Dates for an IST month.
 */
export const getISTMonthBoundaries = (year: number, month: number) => {
    // 00:00 IST on the 1st of the month
    const startObj = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    startObj.setTime(startObj.getTime() - IST_OFFSET_MS);

    // 23:59:59 IST on the last day of the month
    const endObj = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    endObj.setTime(endObj.getTime() - IST_OFFSET_MS);

    return { start: startObj, end: endObj };
};

/**
 * Formats a UTC Date to IST time string for display (e.g. "10:23 AM").
 */
export const formatISTTime = (date: Date): string => {
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
    });
};
