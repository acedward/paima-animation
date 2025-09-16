export const baseBlockWidth = 100; // Increased for better number visibility
export const blockHeight = 40;
export const blockSpacing = 2;
export const baseTimingMs = 2000;
export const greyColor = '#7f8c8d';

// Flat color palette for merged blocks
export const mergeColors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', 
    '#1abc9c', '#e67e22', '#34495e', '#f1c40f', '#16a085'
];

// Table configuration
export const tableConfig = {
    width: 220,
    height: 140,
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
    color: '#ffffff'
};
