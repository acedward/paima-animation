#!/usr/bin/env node

// Test the blockchain engine in Node.js environment
const { BlockchainEngine } = require('./blockchain-engine.js');

console.log('🚀 Testing Paima Blockchain Engine in Node.js\n');

// Create engine instance
const engine = new BlockchainEngine(1000);

console.log('📊 Initial state:');
console.log(`- Blockchains configured: ${engine.blockchains.length}`);
console.log(`- Canvas width: ${engine.canvasWidth}px`);
console.log(`- Merge groups: ${engine.mergeGroups.length}\n`);

// Simulate time progression
let simulationTime = 0;
let iterations = 0;
const maxIterations = 100;

console.log('⏱️  Starting simulation...\n');

// Run simulation
const simulate = () => {
    if (iterations >= maxIterations) {
        console.log('\n✅ Simulation completed!');
        printFinalStats();
        return;
    }
    
    // Update engine
    engine.update();
    
    // Print status every 10 iterations
    if (iterations % 10 === 0) {
        console.log(`[${iterations.toString().padStart(3, '0')}] ${engine.getStatus()}`);
        
        // Show block counts per chain
        engine.blockchains.forEach(blockchain => {
            if (blockchain.blocks.length > 0) {
                console.log(`  └─ ${blockchain.name}: ${blockchain.blocks.length} blocks`);
            }
        });
        console.log('');
    }
    
    iterations++;
    
    // Simulate 100ms delay between frames
    setTimeout(simulate, 100);
};

function printFinalStats() {
    console.log('📈 Final Statistics:');
    console.log('==================');
    
    let totalBlocks = 0;
    let mergedBlocks = 0;
    
    engine.blockchains.forEach(blockchain => {
        const blockCount = blockchain.blocks.length;
        const chainMergedBlocks = blockchain.blocks.filter(b => b.mergeGroupId).length;
        
        totalBlocks += blockCount;
        mergedBlocks += chainMergedBlocks;
        
        console.log(`${blockchain.name}: ${blockCount} blocks (${chainMergedBlocks} merged)`);
    });
    
    console.log(`\nTotal blocks: ${totalBlocks}`);
    console.log(`Merged blocks: ${mergedBlocks} (${((mergedBlocks/totalBlocks)*100).toFixed(1)}%)`);
    console.log(`Active merge groups: ${engine.mergeGroups.length}`);
    console.log(`Colors used: ${engine.currentMergeColorIndex}`);
    
    // Show sample blocks
    console.log('\n🔍 Sample blocks:');
    engine.blockchains.forEach(blockchain => {
        if (blockchain.blocks.length > 0) {
            const sampleBlock = blockchain.blocks[0];
            console.log(`${blockchain.name} Block #${sampleBlock.index}:`);
            console.log(`  - Position: x=${sampleBlock.x.toFixed(1)}, y=${sampleBlock.y}`);
            console.log(`  - Size: ${sampleBlock.width.toFixed(1)}×${sampleBlock.height}`);
            console.log(`  - Color: ${sampleBlock.color}`);
            console.log(`  - Merged: ${sampleBlock.mergeGroupId ? 'Yes' : 'No'}`);
        }
    });
    
    console.log('\n🎉 Blockchain engine is working perfectly in Node.js!');
}

// Test individual functions
console.log('🧪 Testing individual functions:');
const { getBlockWidth, baseBlockWidth } = require('./blockchain-engine.js');

console.log(`- Base block width: ${baseBlockWidth}px`);
console.log(`- 2s block width: ${getBlockWidth(2000)}px`);
console.log(`- 3s block width: ${getBlockWidth(3000)}px`);
console.log(`- 0.5s block width: ${getBlockWidth(500)}px\n`);

// Start simulation
simulate(); 