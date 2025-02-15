import { world } from "@minecraft/server";

class Warps {
    static warps;

    static init() {
        const warps = world.getDynamicProperty('warps');
        try {
            this.warps = JSON.parse(warps);
        } catch {
            this.warps = {};
        }
    }

    static updateDP() {
        world.setDynamicProperty(`warps`, JSON.stringify(this.warps));
    }

    static add(name, location, dimensionId) {
        if (this.has(name))
            throw new Error('Warp already exists');
        this.warps[name] = { 
            name,
            location,
            dimensionId
        };
        this.updateDP();
    }

    static remove(name) {
        if (!this.has(name))
            throw new Error(`Failed to remove warp ${name}`);
        delete this.warps[name];
        this.updateDP();
    }

    static teleport(player, name) {
        const warp = this.warps[name];
        if (!warp)
            throw new Error('Warp does not exist');
        player.teleport({ x: warp.location.x, y: warp.location.y, z: warp.location.z }, { dimension: world.getDimension(warp.dimensionId) });
    }

    static has(name) {
        return this.warps[name] !== undefined;
    }

    static isEmpty() {
        return Object.keys(this.warps).length === 0;
    }

    static getNames() {
        return Object.keys(this.warps);
    }
}

Warps.init();

export default Warps;