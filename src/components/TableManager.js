import { tableConfig } from '../config.js';
import { Table } from './Table.js';
import { EventTypes } from './EventTypes.js';

/**
 * @class TableManager
 * @description Manages the state and logic for all SQL tables in the simulation.
 * 
 * This class is responsible for initializing the tables, processing events to update
 * their data, and selecting the appropriate table for a given action. It encapsulates
 * all table-related operations, keeping them separate from the main engine logic.
 */
export class TableManager {
    constructor(engine) {
        this.engine = engine;
        this.tables = {};
        this.initializeTables();
    }

    initializeTables() {
        this.tables = {
            erc20_balance: new Table(
                'ERC20 Balance',
                ['Address', 'Balance'],
                50,
                60
            ),
            erc721_ownership: new Table(
                'ERC721 Ownership',
                ['Asset ID', 'Owner'],
                50 + tableConfig.width + tableConfig.spacing,
                60
            ),
            current_position: new Table(
                'Current Position',
                ['User ID', 'X', 'Y', 'Char ID'],
                50 + (tableConfig.width + tableConfig.spacing) * 2,
                60
            ),
            accounts_to_address: new Table(
                'Accounts to Address',
                ['User ID', 'Address'],
                50 + (tableConfig.width + tableConfig.spacing) * 3,
                60
            )
        };
    }

    _updateERC20Balance(tables, address, amount, timestamp) {
        const table = tables.erc20_balance;
        table.updateData([address, amount], timestamp);
    }
    
    _updateERC721Ownership(tables, tokenId, owner, timestamp) {
        const table = tables.erc721_ownership;
        table.updateData([tokenId.toString(), owner], timestamp);
    }
    
    _updateCurrentPosition(tables, userId, x, y, characterId, timestamp) {
        const table = tables.current_position;
        table.updateData([userId.toString(), x.toString(), y.toString(), characterId.toString()], timestamp);
    }
    
    _updateAccountsToAddress(tables, userId, address, timestamp) {
        const table = tables.accounts_to_address;
        table.updateData([userId.toString(), address], timestamp);
    }
    
    _processEvent(event, tables, currentTime) {
        switch (event.type) {
            case EventTypes.ERC20_TRANSFER:
                this._updateERC20Balance(tables, event.data.to, event.data.amount, currentTime);
                break;
            case EventTypes.ERC721_TRANSFER:
                this._updateERC721Ownership(tables, event.data.tokenId, event.data.to, currentTime);
                break;
            case EventTypes.GAME_MOVE:
                this._updateCurrentPosition(tables, event.data.userId, event.data.x, event.data.y, event.data.characterId, currentTime);
                break;
            case EventTypes.ACCOUNT_CREATED:
                this._updateAccountsToAddress(tables, event.data.userId, event.data.address, currentTime);
                break;
        }
    }

    processActionEvents(action) {
        const currentTime = Date.now();
        
        action.events.forEach(event => {
            this._processEvent(event, this.tables, currentTime);
        });
    }

    selectAppropriateTable(action) {
        if (action.events.length === 0) {
            const tableNames = Object.keys(this.tables);
            const randomTableName = tableNames[Math.floor(Math.random() * tableNames.length)];
            return this.tables[randomTableName];
        }
        
        const eventToTable = {
            [EventTypes.ERC20_TRANSFER]: 'erc20_balance',
            [EventTypes.ERC721_TRANSFER]: 'erc721_ownership',
            [EventTypes.GAME_MOVE]: 'current_position',
            [EventTypes.ACCOUNT_CREATED]: 'accounts_to_address'
        };
        
        for (const event of action.events) {
            const tableName = eventToTable[event.type];
            if (tableName && this.tables[tableName]) {
                return this.tables[tableName];
            }
        }
        
        const tableNames = Object.keys(this.tables);
        const randomTableName = tableNames[Math.floor(Math.random() * tableNames.length)];
        return this.tables[randomTableName];
    }

    update() {
        Object.values(this.tables).forEach(table => {
            table.update();
        });
    }
}
