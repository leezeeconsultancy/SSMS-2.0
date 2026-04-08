import tzlookup from 'tz-lookup';

/**
 * Global Timezone Utilities (Refactored for GPS-based location)
 * Default fallback is still Asia/Kolkata (IST).
 */

const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Maps GPS coordinates to a timezone string (e.g. "Asia/Kolkata").
 * Returns Asia/Kolkata as fallback.
 */
export const getTimeZoneFromCoords = (lat: number, lng: number): string => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return DEFAULT_TIMEZONE;
    try {
        return tzlookup(lat, lng);
    } catch (e) {
        console.error('Timezone lookup failed:', e);
        return DEFAULT_TIMEZONE;
    }
};

/**
 * Returns UTC Date components for a specific timezone.
 */
export const getTZComponents = (date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE) => {
    const tzStr = date.toLocaleString('en-US', { timeZone });
    const tzDate = new Date(tzStr);
    return {
        hours: tzDate.getHours(),
        minutes: tzDate.getMinutes(),
        day: tzDate.getDay(),
        date: tzDate.getDate(),
        month: tzDate.getMonth(),
        year: tzDate.getFullYear(),
        dateString: `${tzDate.getFullYear()}-${String(tzDate.getMonth() + 1).padStart(2, '0')}-${String(tzDate.getDate()).padStart(2, '0')}`,
    };
};

/**
 * Deprecated: Use getTZComponents with 'Asia/Kolkata' or detect timezone.
 */
export const getISTComponents = (date: Date = new Date()) => getTZComponents(date, 'Asia/Kolkata');

/**
 * Returns a UTC Date representing the START (00:00:00) of a day in a given timezone.
 */
export const getTZStartOfDay = (date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): Date => {
    const components = getTZComponents(date, timeZone);
    // Create UTC point at 00:00
    const utcMidnight = new Date(Date.UTC(components.year, components.month, components.date, 0, 0, 0, 0));
    
    // Adjust for the specific timezone's offset at that point in time
    const localTimeAtMidnight = new Date(utcMidnight.toLocaleString('en-US', { timeZone }));
    const offsetMs = localTimeAtMidnight.getTime() - utcMidnight.getTime();
    
    utcMidnight.setTime(utcMidnight.getTime() - offsetMs);
    return utcMidnight;
};

/**
 * Deprecated: Use getTZStartOfDay.
 */
export const getISTStartOfDay = (date: Date = new Date()): Date => getTZStartOfDay(date, 'Asia/Kolkata');

/**
 * Returns a UTC Date representing the END (23:59:59) of a day in a given timezone.
 */
export const getTZEndOfDay = (date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): Date => {
    const start = getTZStartOfDay(date, timeZone);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
};

/**
 * Returns YYYY-MM-DD string for a specific timezone.
 */
export const getTodayStringTZ = (date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): string => {
    return getTZComponents(date, timeZone).dateString;
};

/**
 * Deprecated: Use getTodayStringTZ.
 */
export const getTodayStringIST = (date: Date = new Date()): string => getTodayStringTZ(date, 'Asia/Kolkata');

/**
 * Returns starting and ending UTC Dates for a month in a specific timezone.
 */
export const getTZMonthBoundaries = (year: number, month: number, timeZone: string = DEFAULT_TIMEZONE) => {
    // 00:00 on the 1st
    const startComp = { year, month: month - 1, date: 1 };
    const start = getTZStartOfDay(new Date(Date.UTC(startComp.year, startComp.month, startComp.date)), timeZone);

    // 23:59:59 on the last day
    const lastDay = new Date(Date.UTC(year, month, 0));
    const end = getTZEndOfDay(lastDay, timeZone);

    return { start, end };
};

/**
 * Formats a Date to a specific timezone string for display.
 */
export const formatTZTime = (date: Date, timeZone: string = DEFAULT_TIMEZONE): string => {
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone,
    });
};

/**
 * Deprecated: Use formatTZTime.
 */
export const formatISTTime = (date: Date): string => formatTZTime(date, 'Asia/Kolkata');

/**
 * Deprecated: Use getTZMonthBoundaries.
 */
export const getISTMonthBoundaries = (year: number, month: number) => getTZMonthBoundaries(year, month, 'Asia/Kolkata');
