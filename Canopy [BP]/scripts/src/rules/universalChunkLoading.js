import { BooleanRule, Rules } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";

new BooleanRule({
    category: 'Rules',
    identifier: 'universalChunkLoading',
    description: { translate: 'rules.universalChunkLoading' }
});

const EVENT_IDENTIFIER = 'canopy:tick_tenSeconds';

world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== 'minecraft:minecart' || !Rules.getNativeValue('universalChunkLoading')) return;
    try {
        event.entity.triggerEvent(EVENT_IDENTIFIER);
    } catch(error) {
        if (error.includes(`${EVENT_IDENTIFIER} does not exist on minecraft:minecart`))
            throw new Error(`[Canopy] ${EVENT_IDENTIFIER} could not be triggered on minecraft:minecart. Are you using another pack that overrides minecarts?`);
        throw error;
    }
});
