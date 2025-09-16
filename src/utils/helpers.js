/**
 * @file helpers.js
 * @description Provides a collection of utility functions for the blockchain animation.
 * 
 * This file includes helper functions for generating random sample data used throughout
 * the simulation. These functions create randomized addresses, balances, user IDs, positions,
 * and blockchain events, adding a dynamic and unpredictable element to the visualization.
 */
import { randomMultipliers } from '../random.js';
import { EventTypes } from '../components/EventTypes.js';

// Calculate block width based on timing
export function getBlockWidth(timingMs) {
    return baseBlockWidth * (timingMs / baseTimingMs);
}

// Sample data generators
export function generateRandomAddress() {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address.substring(0, 12) + '...'; // Truncate for display
}

export function generateRandomBalance() {
    return (Math.random() * randomMultipliers.generateRandomBalance).toFixed(2);
}

export function generateRandomUserId() {
    return Math.floor(Math.random() * randomMultipliers.generateRandomUserId) + 1;
}

export function generateRandomPosition() {
    return {
        x: Math.floor(Math.random() * randomMultipliers.generateRandomPosition),
        y: Math.floor(Math.random() * randomMultipliers.generateRandomPosition)
    };
}

export function generateRandomCharacterId() {
    return Math.floor(Math.random() * randomMultipliers.generateRandomCharacterId) + 1;
}

export function generateRandomAssetId() {
    return Math.floor(Math.random() * randomMultipliers.generateRandomAssetId) + 1;
}

// Generate blockchain events
export function generateBlockchainEvent(chainName) {
    const eventTypes = Object.values(EventTypes);
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const timestamp = Date.now();
    
    switch (eventType) {
        case EventTypes.ERC20_TRANSFER:
            return {
                type: EventTypes.ERC20_TRANSFER,
                chain: chainName,
                timestamp: timestamp,
                data: {
                    from: generateRandomAddress(),
                    to: generateRandomAddress(),
                    amount: generateRandomBalance()
                }
            };
        case EventTypes.ERC721_TRANSFER:
            return {
                type: EventTypes.ERC721_TRANSFER,
                chain: chainName,
                timestamp: timestamp,
                data: {
                    tokenId: generateRandomAssetId(),
                    from: generateRandomAddress(),
                    to: generateRandomAddress()
                }
            };
        case EventTypes.GAME_MOVE:
            const pos = generateRandomPosition();
            return {
                type: EventTypes.GAME_MOVE,
                chain: chainName,
                timestamp: timestamp,
                data: {
                    userId: generateRandomUserId(),
                    x: pos.x,
                    y: pos.y,
                    characterId: generateRandomCharacterId()
                }
            };
        case EventTypes.ACCOUNT_CREATED:
            return {
                type: EventTypes.ACCOUNT_CREATED,
                chain: chainName,
                timestamp: timestamp,
                data: {
                    userId: generateRandomUserId(),
                    address: generateRandomAddress()
                }
            };
        default:
            return null;
    }
}
