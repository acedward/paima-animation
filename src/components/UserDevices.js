import { UserDevice } from './UserDevice.js';
import { randomMultipliers } from '../random.js';

export class UserDevices {
    constructor(engine) {
        this.engine = engine;
        this.devices = [];
        this.maxDevices = 10;
        this.lastAddTime = Date.now();
        this.addInterval = Math.random() * randomMultipliers.userDeviceAddInterval.multiplier + randomMultipliers.userDeviceAddInterval.offset;
    }

    update() {
        const now = Date.now();

        // Add new devices periodically
        if (this.devices.length < this.maxDevices && now - this.lastAddTime > this.addInterval) {
            this.lastAddTime = now;
            this.addInterval = Math.random() * randomMultipliers.userDeviceAddInterval.multiplier + randomMultipliers.userDeviceAddInterval.offset;
            const x = Math.random() * this.engine.width;
            const y = Math.random() * this.engine.height;
            this.devices.push(new UserDevice(x, y));
        }

        // Update existing devices
        for (let i = this.devices.length - 1; i >= 0; i--) {
            const device = this.devices[i];
            device.update(this.engine);
            if (!device.isActive) {
                this.devices.splice(i, 1);
            }
        }
    }

    addDevice(x, y) {
        if (this.devices.length < this.maxDevices) {
            this.devices.push(new UserDevice(x, y));
        }
    }
}
