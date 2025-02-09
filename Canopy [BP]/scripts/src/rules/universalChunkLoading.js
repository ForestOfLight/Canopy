import { Rule, Rules } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'universalChunkLoading',
    description: { translate: 'rules.universalChunkLoading' },
});

world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== 'minecraft:minecart' || !Rules.getNativeValue('universalChunkLoading')) return;
    event.entity.triggerEvent('canopy:tick_tenSeconds');
});
