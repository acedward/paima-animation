import { UserDevice } from './UserDevice.js';
import { randomMultipliers } from '../random.js';

/**
 * @class UserDevices
 * @description Manages a collection of UserDevice objects in the animation.
 * 
 * This class is responsible for the lifecycle of user devices, including their creation,
 * updates, and removal. It ensures that the number of devices stays within a defined range.
 * It also draws a container box for the user devices on the canvas to visually group them.
 */
export class UserDevices {
    constructor(engine) {
        this.engine = engine;
        this.devices = [];
        this.userDeviceCounter = 0;
        this.deviceLifecycleInterval = 2000;
        this.nextDeviceCheck = Date.now() + this.deviceLifecycleInterval;
        this.maxUserDevices = 20;
        this.minUserDevices = 5;

        for (let i = 0; i < 10; i++) {
            this.devices.push(this._createNewUserDevice());
        }
    }

    _createNewUserDevice() {
        while (true) {
            const x = this.engine.canvasWidth * 0.87 + Math.random() * randomMultipliers.userDeviceCreationPosition; // Right side of the screen
            const y = Math.random() * randomMultipliers.userDeviceCreationPosition + this.engine.canvasHeight * 0.7; // Spread vertically
            // check if is overlapping with other devices
            if (this.devices.some(d => d.x + d.radius > x && d.x - d.radius < x && d.y + d.radius > y && d.y - d.radius < y)) {
                continue;
            }
    
            const deviceName = `User ${this.userDeviceCounter++}`;
            return new UserDevice(x, y, deviceName);
        }
    }

    update() {
        // Handle device lifecycle
        if (Date.now() > this.nextDeviceCheck) {
            // Attempt to remove a device
            if (this.devices.length > this.minUserDevices && Math.random() < randomMultipliers.deviceRemovalChance) {
                const activeDevices = this.devices.filter(d => d.state === 'ACTIVE');
                if (activeDevices.length > 0) {
                    const deviceToDisappear = activeDevices[Math.floor(Math.random() * activeDevices.length)];
                    deviceToDisappear.disappear();
                }
            }
    
            // Attempt to add a device
            if (this.devices.length < this.maxUserDevices && Math.random() < randomMultipliers.deviceAdditionChance) {
                this.devices.push(this._createNewUserDevice());
            }
    
            this.nextDeviceCheck = Date.now() + this.deviceLifecycleInterval;
        }

        // Update existing devices
        this.devices.forEach(device => device.update(this.engine));
        this.devices = this.devices.filter(d => d.isActive !== false);
    }

    getTooltipData() {
        return {
            title: 'User Devices',
            content: 'Simulates a collection of user devices sending requests to a blockchain or the batcher.',
            data: `Device Count: ${this.devices.length}`
        };
    }

    isInside(x, y) {
        const rect = this.getContainerRect();
        return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
    }

    getContainerRect() {
        const userDevicesArea = {
            x: this.engine.canvasWidth * 0.87,
            y: this.engine.canvasHeight * 0.7,
            width: 80,
            height: 80
        };
        const boxPadding = 15;
        const titleHeight = 30;

        return {
            x: userDevicesArea.x - boxPadding,
            width: userDevicesArea.width + (2 * boxPadding) + 20,
            y: userDevicesArea.y - boxPadding - titleHeight,
            height: userDevicesArea.height + (2 * boxPadding) + titleHeight
        };
    }

    drawContainer(ctx) {
        // Define user device area and box
        const rect = this.getContainerRect();

        ctx.save();

        // Draw the semi-transparent box
        ctx.fillStyle = 'rgba(25, 177, 123, 0.1)';
        ctx.strokeStyle = '#19b17b';
        ctx.lineWidth = 1;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

        // Draw title for User Devices
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('User Devices', rect.x + rect.width / 2, rect.y + 20);

        ctx.restore();
    }
}
