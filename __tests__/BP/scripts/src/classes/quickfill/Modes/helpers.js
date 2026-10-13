import { readFileSync } from "node:fs";
import { Container, EntityComponentTypes, ItemStack, Player } from "@minecraft/server";

export const stack = (typeId, amount = 1) => new ItemStack(`minecraft:${typeId}`, amount);

export const containerOf = (size, items = {}) => new Container({ size, items });

export const contents = (container) => Array.from({ length: container.size }, (_, i) => {
    const itemStack = container.getItem(i);
    return itemStack ? [itemStack.typeId.replace('minecraft:', ''), itemStack.amount] : void 0;
});

export const countOf = (container, typeId) => {
    let total = 0;
    for (let i = 0; i < container.size; i++) {
        const itemStack = container.getItem(i);
        if (itemStack?.typeId === `minecraft:${typeId}`)
            total += itemStack.amount;
    }
    return total;
};

export const playerWith = (gameMode, items = {}) => {
    const player = new Player();
    player.getGameMode.mockReturnValue(gameMode);
    const inventory = player.getComponent(EntityComponentTypes.Inventory).container;
    Object.entries(items).forEach(([slot, itemStack]) => inventory.setItem(Number(slot), itemStack));
    return { player, inventory };
};

export const lastActionBar = (player) => player.onScreenDisplay.setActionBar.mock.calls.at(-1)?.[0];

export const actionBarCount = (player) => player.onScreenDisplay.setActionBar.mock.calls.length;

const enLang = readFileSync(new URL("../../../../../../../Canopy[RP]/texts/en_US.lang", import.meta.url), 'utf8');

export const langKeys = new Set(enLang.split('\n').map(line => line.split('=')[0].trim()));
