export const ProxyLayout = Object.freeze({
    Hopper: "hopper",
    Chest: "chest"
});

const HOPPER_TYPE_IDS = new Set([
    "minecraft:hopper",
    "minecraft:hopper_minecart"
]);

export const CHEST_SLOT_COUNT = 27;

export function layoutForTarget(typeId) {
    if (HOPPER_TYPE_IDS.has(typeId))
        return ProxyLayout.Hopper;
    return ProxyLayout.Chest;
}
