import { system, world } from "@minecraft/server";

const beaconRefreshOffset = {};
const BEACON_REFRESH_RATE = 80;

export class Instaminable {
    #isBlockTypeCallback;
    #runner = void 0;

    constructor(blockTypeCallback) {
        this.#isBlockTypeCallback = blockTypeCallback;
        this.onPlayerStartBreakingBlockBound = this.onPlayerStartBreakingBlock.bind(this);
        this.onEffectAddBound = this.onEffectAdd.bind(this);
    }

    subscribeToEvents() {
        this.#runner = system.runInterval(() => this.onTick());
        world.afterEvents.playerStartBreakingBlock.subscribe(this.onPlayerStartBreakingBlockBound);
        world.afterEvents.effectAdd.subscribe(this.onEffectAddBound);
    }

    unsubscribeFromEvents() {
        if (this.#runner !== void 0)
            system.clearRun(this.#runner);
        world.afterEvents.playerStartBreakingBlock.unsubscribe(this.onPlayerStartBreakingBlockBound);
        world.afterEvents.effectAdd.unsubscribe(this.onEffectAddBound);
    }

    onTick() {
        for (const player of world.getPlayers()) {
            if (!player)
                continue;
            if (player.getEffect('haste')?.amplifier === 2 && this.isTickBeforeRefresh(player))
                player.removeEffect('haste');
        }
    }

    onPlayerStartBreakingBlock(event) {
        if (!this.#isBlockTypeCallback(event.block.typeId))
            return;
        const player = event.player;
        if (this.isEfficiencyFiveNetheritePick(event.heldItemStack) && this.hasHasteTwo(player)) {
            const duration = player.getEffect("haste")?.duration;
            if (duration > 0)
                system.run(() => player.addEffect('haste', duration, { amplifier: 2 }));
        }
    }

    onEffectAdd(event) {
        if (event.effect?.typeId !== 'minecraft:haste' || event.entity?.typeId !== 'minecraft:player')
            return;
        beaconRefreshOffset[event.entity.id] = system.currentTick % BEACON_REFRESH_RATE;
    }

    isTickBeforeRefresh(player) {
        return beaconRefreshOffset[player.id] === (system.currentTick + 1) % BEACON_REFRESH_RATE;
    }

    isEfficiencyFiveNetheritePick(itemStack) {
        if (itemStack && itemStack.typeId === 'minecraft:netherite_pickaxe') {
            const enchants = itemStack.getComponent('minecraft:enchantable').getEnchantments();
            return enchants.some(enchant => enchant.type.id === 'efficiency' && enchant.level === 5);
        }
        return false;
    }

    hasHasteTwo(player) {
        const haste = player.getEffect('haste');
        return haste?.amplifier === 1;
    }
}
