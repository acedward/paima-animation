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
    return (Math.random() * 1000).toFixed(2);
}

export function generateRandomUserId() {
    return Math.floor(Math.random() * 999) + 1;
}

export function generateRandomPosition() {
    return {
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10)
    };
}

export function generateRandomCharacterId() {
    return Math.floor(Math.random() * 5) + 1;
}

export function generateRandomAssetId() {
    return Math.floor(Math.random() * 9999) + 1;
}

// Generate blockchain events
export function generateBlockchainEvent(chainName) {
    const eventTypes = ['erc20_transfer', 'erc721_transfer', 'game_move', 'account_created'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const timestamp = Date.now();
    
    switch (eventType) {
        case 'erc20_transfer':
            return {
                type: 'erc20_transfer',
                chain: chainName,
                timestamp: timestamp,
                data: {
                    from: generateRandomAddress(),
                    to: generateRandomAddress(),
                    amount: generateRandomBalance()
                }
            };
        case 'erc721_transfer':
            return {
                type: 'erc721_transfer',
                chain: chainName,
                timestamp: timestamp,
                data: {
                    tokenId: generateRandomAssetId(),
                    from: generateRandomAddress(),
                    to: generateRandomAddress()
                }
            };
        case 'game_move':
            const pos = generateRandomPosition();
            return {
                type: 'game_move',
                chain: chainName,
                timestamp: timestamp,
                data: {
                    userId: generateRandomUserId(),
                    x: pos.x,
                    y: pos.y,
                    characterId: generateRandomCharacterId()
                }
            };
        case 'account_created':
            return {
                type: 'account_created',
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
