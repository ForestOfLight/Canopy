import { Rules} from "../../lib/canopy/Canopy";
import { system, world } from "@minecraft/server";

const beaconRefreshOffset = {};
const BEACON_REFRESH_RATE = 80;

world.afterEvents.effectAdd.subscribe(event => {
    if (event.effect?.typeId !== 'haste' || event.entity?.typeId !== 'minecraft:player') return;
    beaconRefreshOffset[event.entity.id] = system.currentTick % BEACON_REFRESH_RATE;
});

class Instaminable {
    constructor(litmusCallback, ruleId) {
        this.litmusCallback = litmusCallback;
        this.ruleId = ruleId;
        this.init();
    }

    init() {
        system.runInterval(() => {
            for (const player of world.getPlayers()) {
                if (!player)
                    continue;
                if (player.getEffect('haste')?.amplifier === 2 && this.isTickBeforeRefresh(player)) 
                    player.removeEffect('haste');
                
            }
        });

        world.beforeEvents.playerBreakBlock.subscribe((event) => {
            const blockId = event.block.typeId;
            if (Rules.getNativeValue(this.ruleId) !== true) return;
            if (!this.litmusCallback(blockId)) return;
            const player = event.player;
            if (this.isEfficiencyFiveNetheritePick(event.itemStack) && this.hasHasteTwo(player)) {
                const duration = player.getEffect('haste')?.duration;
                if (duration > 0)
                    system.run(() => player.addEffect('haste', duration, { amplifier: 2 }));
            }
        });
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

export default Instaminable;