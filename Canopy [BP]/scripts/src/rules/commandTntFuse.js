import { world } from "@minecraft/server";
import { GlobalRule } from "../../lib/canopy/Canopy";
import { TNTFuse } from "../classes/TNTFuse";

const ruleID = 'commandTntFuse';

class CommandTntFuse extends GlobalRule {
    fuseTicksDP = 'tntFuseTicks';
    
    constructor() {
        super({
            identifier: ruleID
        });
        this.subscribeToEvents();
    }

    subscribeToEvents() {
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawn.bind(this));
    }
    
    onEntitySpawn(event) {
        if (event.entity?.typeId !== 'minecraft:tnt' || event.cause === 'Event') return;
        const fuseTicks = this.getGlobalFuseTicks();
        this.startFuse(event.entity, fuseTicks);
    }

    setGlobalFuseTicks(ticks) {
        world.setDynamicProperty(this.fuseTicksDP, Number(ticks));
    }

    getGlobalFuseTicks() {
        if (this.getNativeValue())
            return world.getDynamicProperty(this.fuseTicksDP) || 80;
        return 80;
    }

    startFuse(entity, fuseTicks) {
        new TNTFuse(entity, fuseTicks);
    }
}

export const commandTntFuse = new CommandTntFuse();