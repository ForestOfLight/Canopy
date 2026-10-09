import { system } from "@minecraft/server";
import { getAllDimensionIds } from "../../include/utils";

export const dimension = getAllDimensionIds();

const enums = { dimension };

system.beforeEvents.startup.subscribe((event) => {
    const commandRegistry = event.customCommandRegistry;
    Object.keys(enums).forEach(enumKey => {
        const name = 'canopy:' + enumKey.toLowerCase();
        if (typeof enums[enumKey] !== "object" || enums[enumKey] === null)
            throw new TypeError(`Enum ${enumKey} must be an object or array`);
        if (Array.isArray(enums[enumKey]))
            commandRegistry.registerEnum(name, enums[enumKey]);
        else
            commandRegistry.registerEnum(name, Object.values(enums[enumKey]));
    });
});
