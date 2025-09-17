/**
 * @file config.js
 * @description Defines configuration constants for the blockchain animation.
 * 
 * This file centralizes all the key parameters that control the appearance and
 * behavior of the animation. It includes settings for block dimensions, colors,
 * table layouts, and action properties. By modifying the values in this file,
 * the overall look and feel of the simulation can be easily adjusted without
 * changing the core logic.
 */
export const baseBlockWidth = 100; // Increased for better number visibility
export const blockHeight = 40;
export const blockSpacing = 2;
export const baseTimingMs = 2000;

// Table configuration
export const tableConfig = {
    width: 220,
    height: 150,
    headerHeight: 25,
    rowHeight: 20,
    maxRows: 5,
    spacing: 30,
    blinkDuration: 1500 // ms - increased for more subtle effect
};

// Action configuration
export const actionConfig = {
    height: 20, // 1/3 of block height (60px / 3)
    width: 20,  // Square shape
    yPosition: 270, // Between tables and chains
    futureTimeRange: 1000, // Schedule actions up to 1 seconds in the future
};
