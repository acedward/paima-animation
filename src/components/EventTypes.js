export const EventTypes = {
    ERC20_TRANSFER: 'erc20_transfer',
    ERC721_TRANSFER: 'erc721_transfer',
    GAME_MOVE: 'game_move',
    ACCOUNT_CREATED: 'account_created',
};

export const EventColors = {
    [EventTypes.ERC20_TRANSFER]: '#f39c12',
    [EventTypes.ERC721_TRANSFER]: '#9b59b6',
    [EventTypes.GAME_MOVE]: '#3498db',
    [EventTypes.ACCOUNT_CREATED]: '#2ecc71'
};

function updateERC20Balance(tables, address, amount, timestamp) {
    const table = tables.erc20_balance;
    table.updateData([address, amount], timestamp);
}

function updateERC721Ownership(tables, tokenId, owner, timestamp) {
    const table = tables.erc721_ownership;
    table.updateData([tokenId.toString(), owner], timestamp);
}

function updateCurrentPosition(tables, userId, x, y, characterId, timestamp) {
    const table = tables.current_position;
    table.updateData([userId.toString(), x.toString(), y.toString(), characterId.toString()], timestamp);
}

function updateAccountsToAddress(tables, userId, address, timestamp) {
    const table = tables.accounts_to_address;
    table.updateData([userId.toString(), address], timestamp);
}

export function processEvent(event, tables, currentTime) {
    switch (event.type) {
        case EventTypes.ERC20_TRANSFER:
            updateERC20Balance(tables, event.data.to, event.data.amount, currentTime);
            break;
        case EventTypes.ERC721_TRANSFER:
            updateERC721Ownership(tables, event.data.tokenId, event.data.to, currentTime);
            break;
        case EventTypes.GAME_MOVE:
            updateCurrentPosition(tables, event.data.userId, event.data.x, event.data.y, event.data.characterId, currentTime);
            break;
        case EventTypes.ACCOUNT_CREATED:
            updateAccountsToAddress(tables, event.data.userId, event.data.address, currentTime);
            break;
    }
}
