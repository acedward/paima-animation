/**
 * @file EventTypes.js
 * @description Defines the types of events that can occur in the blockchain simulation
 * and their corresponding colors for visualization.
 * 
 * This file serves as a central registry for event definitions. The `EventTypes` object
 * enumerates the possible event types, while `EventColors` maps these types to specific colors
 * for easy identification in the animation.
 */
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
