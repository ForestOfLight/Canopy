import { system } from "@minecraft/server";

export const Dimension = Object.freeze({
    Overworld: 'overworld',
    Nether: 'nether',
    TheEnd: 'the_end',
    OverworldShort: 'o',
    NetherShort: 'n',
    TheEndShort: 'e',
    End: 'end'
});

const enums = { Dimension };

system.beforeEvents.startup.subscribe((event) => {
    const commandRegistry = event.customCommandRegistry;
    Object.keys(enums).forEach(key => {
        const name = 'canopy:' + key.toLowerCase();
        commandRegistry.registerEnum(name, Object.values(enums[key]));
    });
});
