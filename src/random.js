/**
 * @file random.js
 * @description Defines multipliers and offsets for generating random values in the simulation.
 * 
 * This file centralizes the configuration for randomness in the animation. The `randomMultipliers`
 * object contains parameters that control the range and frequency of various randomized
 * events, such as generating balances, creating user devices, and scheduling actions.
 * Adjusting these values can significantly alter the dynamics and behavior of the simulation.
 */
export let randomMultipliers = {
    generateRandomBalance: 1000,
    generateRandomUserId: 999,
    generateRandomPosition: 10,
    generateRandomCharacterId: 5,
    generateRandomAssetId: 9999,
    userDeviceRequestInterval: { multiplier: 4000, offset: 1000 },
    userDeviceCreationPosition: 80,
    actionCreationDelay: { multiplier: 2500, offset: 500 },
    blockProcessorToBatcherChance: 0.005,
    deviceRemovalChance: 0.5,
    deviceAdditionChance: 0.5,
};
