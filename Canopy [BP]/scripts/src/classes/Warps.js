import { world } from "@minecraft/server";

class Warps {
    static warps = new Map();

    static init() {
        const warps = world.getDynamicProperty('warps');
        const parsedWarps = JSON.parse(warps);
        this.warps = new Map(Object.entries(parsedWarps));
    }

    static updateDP() {
        world.setDynamicProperty(`warps`, JSON.stringify(this.warps));
    }

    static add(name, location, dimensionId) {
        if (this.warps.has(name))
            throw new Error('Warp already exists');
        this.warps[name] = { 
            name, 
            location,
            dimensionId
        };
        this.updateDP();
    }

    static remove(name) {
        const success = this.warps.delete(name);
        if (!success)
            throw new Error(`Failed to remove warp ${name}`);
        this.updateDP();
    }

    static teleport(player, name) {
        const warp = this.warps.get(name);
        if (!warp)
            throw new Error('Warp does not exist');
        player.teleport({ x: warp.location.x, y: warp.location.y, z: warp.location.z }, { dimension: world.getDimension(warp.dimension.id) });
    }

    static has(name) {
        return this.warps.has(name);
    }

    static isEmpty() {
        return this.warps.size === 0;
    }

    static getNames() {
        return Array.from(this.warps.keys());
    }
}

Warps.init();

export default Warps;