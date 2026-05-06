import { system } from "@minecraft/server";

export class TNTFuse {
    static VANILLA_FUSE_TICKS = 80;
    tntEntity;
    totalFuseTicks;
    runner;

    constructor(tntEntity, fuseTicks = TNTFuse.VANILLA_FUSE_TICKS) {
        if (tntEntity?.typeId !== 'minecraft:tnt')
            throw new Error('[TNTFuse] Fuse length changes only apply to TNT entities.')
        this.tntEntity = tntEntity;
        this.totalFuseTicks = fuseTicks;
        this.startFuse();
    }

    startFuse() {
        const startFuseTicks = this.tntEntity.getDynamicProperty('fuseTicks');
        if (startFuseTicks)
            this.totalFuseTicks = startFuseTicks;
        if (this.totalFuseTicks <= 1) {
            this.triggerExplosion();
            return;
        }
        this.tntEntity.triggerEvent('canopy:fuse');
        this.tntEntity.setDynamicProperty('fuseTicks', this.totalFuseTicks-1);
        this.runner = system.runInterval(this.onTick.bind(this), 1);
    }

    onTick() {
        if (!this.tntEntity.isValid) {
            this.stopFuse();
            return;
        }
        if (this.tntIsUnloaded())
            return;
        const currentFuseTicks = this.tntEntity.getDynamicProperty('fuseTicks');
        if (currentFuseTicks <= 1) {
            this.triggerExplosion();
            this.stopFuse();
        }
        this.tntEntity.setDynamicProperty('fuseTicks', currentFuseTicks - 1);
    }

    stopFuse() {
        system.clearRun(this.runner);
    }

    triggerExplosion() {
        const eventIdentifier = 'canopy:explode';
        try {
            this.tntEntity.triggerEvent(eventIdentifier);
        } catch(error) {
            if (error.includes(`${eventIdentifier} does not exist on minecraft:tnt`))
                throw new Error(`[Canopy] ${eventIdentifier} could not be triggered on minecraft:tnt. Are you using another pack that overrides tnt?`);
            throw error;
        }
    }

    tntIsUnloaded() {
        return !this.tntEntity.dimension.isChunkLoaded(this.tntEntity.location);
    }
}