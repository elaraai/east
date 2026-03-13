/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, DateTimeType, IntegerType, FloatType, BooleanType, StringType, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Component Extraction
// ---------------------------------------------------------------------------

export const datetimeGetYear = example({
    keywords: ["datetime", "DateTimeType", "getYear", "year", "component"],
    description: "Extract the year from a datetime",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        return d.getYear();
    }),
    inputs: [],
    returns: 2024n,
});

export const datetimeGetMonth = example({
    keywords: ["datetime", "DateTimeType", "getMonth", "month", "component"],
    description: "Extract the month (1-12) from a datetime",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        return d.getMonth();
    }),
    inputs: [],
    returns: 3n,
});

export const datetimeGetDayOfMonth = example({
    keywords: ["datetime", "DateTimeType", "getDayOfMonth", "day", "component"],
    description: "Extract the day of month (1-31) from a datetime",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        return d.getDayOfMonth();
    }),
    inputs: [],
    returns: 15n,
});

export const datetimeGetHour = example({
    keywords: ["datetime", "DateTimeType", "getHour", "hour", "component"],
    description: "Extract the hour (0-23) from a datetime",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        return d.getHour();
    }),
    inputs: [],
    returns: 10n,
});

export const datetimeGetMinute = example({
    keywords: ["datetime", "DateTimeType", "getMinute", "minute", "component"],
    description: "Extract the minute (0-59) from a datetime",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        return d.getMinute();
    }),
    inputs: [],
    returns: 30n,
});

export const datetimeGetSecond = example({
    keywords: ["datetime", "DateTimeType", "getSecond", "second", "component"],
    description: "Extract the second (0-59) from a datetime",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        return d.getSecond();
    }),
    inputs: [],
    returns: 45n,
});

export const datetimeGetDayOfWeek = example({
    keywords: ["datetime", "DateTimeType", "getDayOfWeek", "weekday", "component", "ISO"],
    description: "Extract the ISO day of week (1=Monday, 7=Sunday)",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        return d.getDayOfWeek();
    }),
    inputs: [],
    returns: 5n, // Friday
});

export const datetimeGetMillisecond = example({
    keywords: ["datetime", "DateTimeType", "getMillisecond", "millisecond", "component"],
    description: "Extract the millisecond (0-999) from a datetime",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        return d.getMillisecond();
    }),
    inputs: [],
    returns: 123n,
});

// ---------------------------------------------------------------------------
// Duration Arithmetic (Add)
// ---------------------------------------------------------------------------

export const datetimeAddMilliseconds = example({
    keywords: ["datetime", "DateTimeType", "addMilliseconds", "duration", "add"],
    description: "Add milliseconds to a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:00:00.000Z"), DateTimeType);
        return d.addMilliseconds(1000n);
    }),
    inputs: [],
    returns: new Date("2024-01-01T12:00:01.000Z"),
});

export const datetimeAddSeconds = example({
    keywords: ["datetime", "DateTimeType", "addSeconds", "duration", "add"],
    description: "Add seconds to a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:30:45.000Z"), DateTimeType);
        return d.addSeconds(30n);
    }),
    inputs: [],
    returns: new Date("2024-01-01T12:31:15.000Z"),
});

export const datetimeAddMinutes = example({
    keywords: ["datetime", "DateTimeType", "addMinutes", "duration", "add"],
    description: "Add minutes to a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:30:45.000Z"), DateTimeType);
        return d.addMinutes(90n);
    }),
    inputs: [],
    returns: new Date("2024-01-01T14:00:45.000Z"),
});

export const datetimeAddHours = example({
    keywords: ["datetime", "DateTimeType", "addHours", "duration", "add"],
    description: "Add hours to a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:30:45.000Z"), DateTimeType);
        return d.addHours(36n);
    }),
    inputs: [],
    returns: new Date("2024-01-03T00:30:45.000Z"),
});

export const datetimeAddDays = example({
    keywords: ["datetime", "DateTimeType", "addDays", "duration", "add"],
    description: "Add days to a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:30:45.000Z"), DateTimeType);
        return d.addDays(7n);
    }),
    inputs: [],
    returns: new Date("2024-01-08T12:30:45.000Z"),
});

export const datetimeAddWeeks = example({
    keywords: ["datetime", "DateTimeType", "addWeeks", "duration", "add"],
    description: "Add weeks to a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:30:45.000Z"), DateTimeType);
        return d.addWeeks(2n);
    }),
    inputs: [],
    returns: new Date("2024-01-15T12:30:45.000Z"),
});

// ---------------------------------------------------------------------------
// Duration Arithmetic (Subtract)
// ---------------------------------------------------------------------------

export const datetimeSubtractSeconds = example({
    keywords: ["datetime", "DateTimeType", "subtractSeconds", "duration", "subtract"],
    description: "Subtract seconds from a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:30:45.000Z"), DateTimeType);
        return d.subtractSeconds(30n);
    }),
    inputs: [],
    returns: new Date("2024-01-01T12:30:15.000Z"),
});

export const datetimeSubtractMinutes = example({
    keywords: ["datetime", "DateTimeType", "subtractMinutes", "duration", "subtract"],
    description: "Subtract minutes from a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:30:45.000Z"), DateTimeType);
        return d.subtractMinutes(40n);
    }),
    inputs: [],
    returns: new Date("2024-01-01T11:50:45.000Z"),
});

export const datetimeSubtractHours = example({
    keywords: ["datetime", "DateTimeType", "subtractHours", "duration", "subtract"],
    description: "Subtract hours from a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:30:45.000Z"), DateTimeType);
        return d.subtractHours(15n);
    }),
    inputs: [],
    returns: new Date("2023-12-31T21:30:45.000Z"),
});

export const datetimeSubtractDays = example({
    keywords: ["datetime", "DateTimeType", "subtractDays", "duration", "subtract"],
    description: "Subtract days from a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:30:45.000Z"), DateTimeType);
        return d.subtractDays(2n);
    }),
    inputs: [],
    returns: new Date("2023-12-30T12:30:45.000Z"),
});

export const datetimeSubtractWeeks = example({
    keywords: ["datetime", "DateTimeType", "subtractWeeks", "duration", "subtract"],
    description: "Subtract weeks from a datetime",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-01-01T12:30:45.000Z"), DateTimeType);
        return d.subtractWeeks(1n);
    }),
    inputs: [],
    returns: new Date("2023-12-25T12:30:45.000Z"),
});

// ---------------------------------------------------------------------------
// Duration Calculations
// ---------------------------------------------------------------------------

export const datetimeDurationMilliseconds = example({
    keywords: ["datetime", "DateTimeType", "durationMilliseconds", "difference"],
    description: "Calculate duration between datetimes in milliseconds",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const(new Date("2024-01-01T12:00:00.000Z"), DateTimeType);
        const b = $.const(new Date("2024-01-01T12:01:30.500Z"), DateTimeType);
        return a.durationMilliseconds(b);
    }),
    inputs: [],
    returns: 90500n,
});

export const datetimeDurationSeconds = example({
    keywords: ["datetime", "DateTimeType", "durationSeconds", "difference"],
    description: "Calculate duration between datetimes in seconds",
    fn: East.function([], FloatType, ($) => {
        const a = $.const(new Date("2024-01-01T12:00:00.000Z"), DateTimeType);
        const b = $.const(new Date("2024-01-01T12:01:30.500Z"), DateTimeType);
        return a.durationSeconds(b);
    }),
    inputs: [],
    returns: 90.5,
});

export const datetimeDurationMinutes = example({
    keywords: ["datetime", "DateTimeType", "durationMinutes", "difference"],
    description: "Calculate duration between datetimes in minutes",
    fn: East.function([], FloatType, ($) => {
        const a = $.const(new Date("2024-01-01T12:00:00.000Z"), DateTimeType);
        const b = $.const(new Date("2024-01-01T11:30:00.000Z"), DateTimeType);
        return a.durationMinutes(b);
    }),
    inputs: [],
    returns: -30.0,
});

export const datetimeDurationHours = example({
    keywords: ["datetime", "DateTimeType", "durationHours", "difference"],
    description: "Calculate duration between datetimes in hours",
    fn: East.function([], FloatType, ($) => {
        const a = $.const(new Date("2024-01-01T12:00:00.000Z"), DateTimeType);
        const b = $.const(new Date("2024-01-01T11:30:00.000Z"), DateTimeType);
        return a.durationHours(b);
    }),
    inputs: [],
    returns: -0.5,
});

export const datetimeDurationDays = example({
    keywords: ["datetime", "DateTimeType", "durationDays", "difference"],
    description: "Calculate duration between datetimes in days",
    fn: East.function([], FloatType, ($) => {
        const a = $.const(new Date("2024-01-01T12:00:00.000Z"), DateTimeType);
        const b = $.const(new Date("2024-01-02T15:30:00.000Z"), DateTimeType);
        return a.durationDays(b);
    }),
    inputs: [],
    returns: 1.1458333333333333,
});

export const datetimeDurationWeeks = example({
    keywords: ["datetime", "DateTimeType", "durationWeeks", "difference"],
    description: "Calculate duration between datetimes in weeks",
    fn: East.function([], FloatType, ($) => {
        const a = $.const(new Date("2024-01-01T12:00:00.000Z"), DateTimeType);
        const b = $.const(new Date("2024-01-08T12:00:00.000Z"), DateTimeType);
        return a.durationWeeks(b);
    }),
    inputs: [],
    returns: 1.0,
});

// ---------------------------------------------------------------------------
// Epoch Conversion & Construction
// ---------------------------------------------------------------------------

export const datetimeToEpochMilliseconds = example({
    keywords: ["datetime", "DateTimeType", "toEpochMilliseconds", "epoch", "timestamp"],
    description: "Convert a datetime to epoch milliseconds",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        return d.toEpochMilliseconds();
    }),
    inputs: [],
    returns: 1710498645123n,
});

export const datetimeFromEpochMilliseconds = example({
    keywords: ["datetime", "DateTimeType", "fromEpochMilliseconds", "epoch", "construct"],
    description: "Create a datetime from epoch milliseconds",
    fn: East.function([], DateTimeType, (_$) => {
        return East.DateTime.fromEpochMilliseconds(1710498645123n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:30:45.123Z"),
});

export const datetimeFromComponents = example({
    keywords: ["datetime", "DateTimeType", "fromComponents", "construct", "year", "month", "day"],
    description: "Create a datetime from year/month/day/hour/minute/second/ms components",
    fn: East.function([], DateTimeType, (_$) => {
        return East.DateTime.fromComponents(2024n, 3n, 15n, 10n, 30n, 45n, 123n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:30:45.123Z"),
});

// ---------------------------------------------------------------------------
// Rounding - Round Down
// ---------------------------------------------------------------------------

export const datetimeRoundDownMillisecond = example({
    keywords: ["datetime", "DateTimeType", "roundDownMillisecond", "rounding", "floor"],
    description: "Round down datetime to nearest N milliseconds",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundDownMillisecond);
        return roundFn(d, 100n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:30:45.100Z"),
});

export const datetimeRoundDownSecond = example({
    keywords: ["datetime", "DateTimeType", "roundDownSecond", "rounding", "floor"],
    description: "Round down datetime to nearest N seconds",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundDownSecond);
        return roundFn(d, 10n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:30:40.000Z"),
});

export const datetimeRoundDownMinute = example({
    keywords: ["datetime", "DateTimeType", "roundDownMinute", "rounding", "floor"],
    description: "Round down datetime to nearest N minutes",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundDownMinute);
        return roundFn(d, 15n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:30:00.000Z"),
});

export const datetimeRoundDownHour = example({
    keywords: ["datetime", "DateTimeType", "roundDownHour", "rounding", "floor"],
    description: "Round down datetime to nearest N hours",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundDownHour);
        return roundFn(d, 6n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T06:00:00.000Z"),
});

export const datetimeRoundDownDay = example({
    keywords: ["datetime", "DateTimeType", "roundDownDay", "rounding", "floor"],
    description: "Round down datetime to start of day",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-17T14:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundDownDay);
        return roundFn(d, 1n);
    }),
    inputs: [],
    returns: new Date("2024-03-17T00:00:00.000Z"),
});

export const datetimeRoundDownWeek = example({
    keywords: ["datetime", "DateTimeType", "roundDownWeek", "rounding", "floor", "ISO", "Monday"],
    description: "Round down datetime to start of ISO week (Monday)",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-17T14:30:45.123Z"), DateTimeType); // Sunday
        const roundFn = $.let(East.DateTime.roundDownWeek);
        return roundFn(d, 1n);
    }),
    inputs: [],
    returns: new Date("2024-03-11T00:00:00.000Z"), // Previous Monday
});

export const datetimeRoundDownMonth = example({
    keywords: ["datetime", "DateTimeType", "roundDownMonth", "rounding", "floor"],
    description: "Round down datetime to start of month",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-17T14:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundDownMonth);
        return roundFn(d, 1n);
    }),
    inputs: [],
    returns: new Date("2024-03-01T00:00:00.000Z"),
});

export const datetimeRoundDownYear = example({
    keywords: ["datetime", "DateTimeType", "roundDownYear", "rounding", "floor"],
    description: "Round down datetime to start of year",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-17T14:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundDownYear);
        return roundFn(d, 1n);
    }),
    inputs: [],
    returns: new Date("2024-01-01T00:00:00.000Z"),
});

// ---------------------------------------------------------------------------
// Rounding - Round Up
// ---------------------------------------------------------------------------

export const datetimeRoundUpMillisecond = example({
    keywords: ["datetime", "DateTimeType", "roundUpMillisecond", "rounding", "ceil"],
    description: "Round up datetime to nearest N milliseconds",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundUpMillisecond);
        return roundFn(d, 100n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:30:45.200Z"),
});

export const datetimeRoundUpSecond = example({
    keywords: ["datetime", "DateTimeType", "roundUpSecond", "rounding", "ceil"],
    description: "Round up datetime to nearest N seconds",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundUpSecond);
        return roundFn(d, 10n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:30:50.000Z"),
});

export const datetimeRoundUpMinute = example({
    keywords: ["datetime", "DateTimeType", "roundUpMinute", "rounding", "ceil"],
    description: "Round up datetime to nearest N minutes",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundUpMinute);
        return roundFn(d, 15n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:45:00.000Z"),
});

export const datetimeRoundUpHour = example({
    keywords: ["datetime", "DateTimeType", "roundUpHour", "rounding", "ceil"],
    description: "Round up datetime to nearest N hours",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundUpHour);
        return roundFn(d, 6n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T12:00:00.000Z"),
});

export const datetimeRoundUpDay = example({
    keywords: ["datetime", "DateTimeType", "roundUpDay", "rounding", "ceil"],
    description: "Round up datetime to start of next day",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-17T14:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundUpDay);
        return roundFn(d, 1n);
    }),
    inputs: [],
    returns: new Date("2024-03-18T00:00:00.000Z"),
});

export const datetimeRoundUpWeek = example({
    keywords: ["datetime", "DateTimeType", "roundUpWeek", "rounding", "ceil", "ISO", "Monday"],
    description: "Round up datetime to next ISO week (Monday)",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-17T14:30:45.123Z"), DateTimeType); // Sunday
        const roundFn = $.let(East.DateTime.roundUpWeek);
        return roundFn(d, 1n);
    }),
    inputs: [],
    returns: new Date("2024-03-18T00:00:00.000Z"), // Next Monday
});

// ---------------------------------------------------------------------------
// Rounding - Round Nearest
// ---------------------------------------------------------------------------

export const datetimeRoundNearestMillisecond = example({
    keywords: ["datetime", "DateTimeType", "roundNearestMillisecond", "rounding", "nearest"],
    description: "Round datetime to nearest N milliseconds",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundNearestMillisecond);
        return roundFn(d, 100n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:30:45.100Z"),
});

export const datetimeRoundNearestSecond = example({
    keywords: ["datetime", "DateTimeType", "roundNearestSecond", "rounding", "nearest"],
    description: "Round datetime to nearest N seconds",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundNearestSecond);
        return roundFn(d, 10n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:30:50.000Z"),
});

export const datetimeRoundNearestMinute = example({
    keywords: ["datetime", "DateTimeType", "roundNearestMinute", "rounding", "nearest"],
    description: "Round datetime to nearest N minutes",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundNearestMinute);
        return roundFn(d, 15n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T10:30:00.000Z"),
});

export const datetimeRoundNearestHour = example({
    keywords: ["datetime", "DateTimeType", "roundNearestHour", "rounding", "nearest"],
    description: "Round datetime to nearest N hours",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-15T10:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundNearestHour);
        return roundFn(d, 6n);
    }),
    inputs: [],
    returns: new Date("2024-03-15T12:00:00.000Z"),
});

export const datetimeRoundNearestDay = example({
    keywords: ["datetime", "DateTimeType", "roundNearestDay", "rounding", "nearest"],
    description: "Round datetime to nearest day boundary",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-17T14:30:45.123Z"), DateTimeType);
        const roundFn = $.let(East.DateTime.roundNearestDay);
        return roundFn(d, 1n);
    }),
    inputs: [],
    returns: new Date("2024-03-18T00:00:00.000Z"), // 2:30 PM closer to end of day
});

export const datetimeRoundNearestWeek = example({
    keywords: ["datetime", "DateTimeType", "roundNearestWeek", "rounding", "nearest", "ISO"],
    description: "Round datetime to nearest ISO week (Monday) boundary",
    fn: East.function([], DateTimeType, ($) => {
        const d = $.const(new Date("2024-03-17T14:30:45.123Z"), DateTimeType); // Sunday
        const roundFn = $.let(East.DateTime.roundNearestWeek);
        return roundFn(d, 1n);
    }),
    inputs: [],
    returns: new Date("2024-03-18T00:00:00.000Z"), // Closer to next Monday
});

// ---------------------------------------------------------------------------
// Comparisons (Instance Methods)
// ---------------------------------------------------------------------------

export const datetimeEquals = example({
    keywords: ["datetime", "DateTimeType", "equals", "equality", "comparison"],
    description: "Check datetime equality with equals",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Date("2024-01-01T00:00:00.000Z"), DateTimeType);
        return d.equals(new Date("2024-01-01T00:00:00.000Z"));
    }),
    inputs: [],
    returns: true,
});

export const datetimeNotEquals = example({
    keywords: ["datetime", "DateTimeType", "notEquals", "inequality", "comparison"],
    description: "Check datetime inequality with notEquals",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Date("2024-01-01T00:00:00.000Z"), DateTimeType);
        return d.notEquals(new Date("2024-01-02T00:00:00.000Z"));
    }),
    inputs: [],
    returns: true,
});

export const datetimeLessThan = example({
    keywords: ["datetime", "DateTimeType", "lessThan", "comparison", "ordering"],
    description: "Check if a datetime is before another with lessThan",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Date("2024-01-01T00:00:00.000Z"), DateTimeType);
        return d.lessThan(new Date("2024-01-02T00:00:00.000Z"));
    }),
    inputs: [],
    returns: true,
});

export const datetimeLessThanOrEqual = example({
    keywords: ["datetime", "DateTimeType", "lessThanOrEqual", "comparison", "ordering"],
    description: "Check if a datetime is before or equal to another",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Date("2024-01-01T00:00:00.000Z"), DateTimeType);
        return d.lessThanOrEqual(new Date("2024-01-01T00:00:00.000Z"));
    }),
    inputs: [],
    returns: true,
});

export const datetimeGreaterThan = example({
    keywords: ["datetime", "DateTimeType", "greaterThan", "comparison", "ordering"],
    description: "Check if a datetime is after another with greaterThan",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Date("2024-01-02T00:00:00.000Z"), DateTimeType);
        return d.greaterThan(new Date("2024-01-01T00:00:00.000Z"));
    }),
    inputs: [],
    returns: true,
});

export const datetimeGreaterThanOrEqual = example({
    keywords: ["datetime", "DateTimeType", "greaterThanOrEqual", "comparison", "ordering"],
    description: "Check if a datetime is after or equal to another",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Date("2024-01-01T00:00:00.000Z"), DateTimeType);
        return d.greaterThanOrEqual(new Date("2024-01-01T00:00:00.000Z"));
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Formatted Printing & Parsing
// ---------------------------------------------------------------------------

export const datetimePrintFormatted = example({
    keywords: ["datetime", "DateTimeType", "printFormatted", "format", "string", "display"],
    description: "Format a datetime as a string with a format pattern",
    fn: East.function([], StringType, ($) => {
        const d = $.const(new Date("2025-01-15T14:30:45.123Z"), DateTimeType);
        return d.printFormatted("YYYY-MM-DD HH:mm:ss.SSS");
    }),
    inputs: [],
    returns: "2025-01-15 14:30:45.123",
});

export const datetimeParseFormatted = example({
    keywords: ["datetime", "DateTimeType", "parseFormatted", "parse", "string", "construct"],
    description: "Parse a formatted string into a datetime",
    fn: East.function([], DateTimeType, (_$) => {
        return East.DateTime.parseFormatted("2025-01-15 14:30:45", "YYYY-MM-DD HH:mm:ss");
    }),
    inputs: [],
    returns: new Date("2025-01-15T14:30:45.000Z"),
});

