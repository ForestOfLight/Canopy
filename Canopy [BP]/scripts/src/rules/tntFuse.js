import { world } from "@minecraft/server";
import { GlobalRule, IntegerRule } from "../../lib/canopy/Canopy";
import { TNTFuse } from "../classes/TNTFuse";

class TNTFuseRule extends IntegerRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'tntFuse',
            defaultValue: TNTFuse.VANILLA_FUSE_TICKS,
            valueRange: { range: { min: 1, max: 72000 } }
        }));
        this.subscribeToEvents();
    }

    subscribeToEvents() {
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawn.bind(this));
    }
    
    onEntitySpawn(event) {
        if (event.entity?.typeId !== 'minecraft:tnt' || event.cause === 'Event') return;
        this.startFuse(event.entity, this.getGlobalFuseTicks());
    }

    getGlobalFuseTicks() {
        return this.getNativeValue() || this.getDefaultValue();
    }

    startFuse(entity, fuseTicks) {
        new TNTFuse(entity, fuseTicks);
    }
}

export const tntFuseRule = new TNTFuseRule();