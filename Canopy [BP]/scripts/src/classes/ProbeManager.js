import { system, world, EquipmentSlot, EntityComponentTypes, ItemComponentTypes } from "@minecraft/server";
import Probe from "src/classes/Probe";
import Data from "stickycore/data";

const CLEANUP_INTERVAL = 10 * 20;

const biomeMap = {
    0: 'Bamboo Jungle',
    1: 'Bamboo Jungle Hills',
    2: 'Basalt Deltas',
    3: 'Beach',
    4: 'Birch Forest',
    5: 'Birch Forest Hills',
    6: 'Birch Forest Hills M',
    7: 'Birch Forest M',
    8: 'Cherry Grove',
    9: 'Cold Beach',
    10: 'Cold Ocean',
    11: 'Cold Taiga',
    12: 'Cold Taiga Hills',
    13: 'Cold Taiga M',
    14: 'Crimson Forest',
    15: 'Deep Cold Ocean',
    16: 'Deep Dark',
    17: 'Deep Frozen Ocean',
    18: 'Deep Lukewarm Ocean',
    19: 'Deep Ocean',
    20: 'Deep Warm Ocean',
    21: 'Desert',
    22: 'Desert Hills',
    23: 'Desert M',
    24: 'Dripstone Caves',
    25: 'Extreme Hills',
    26: 'Extreme Hills Edge',
    27: 'Extreme Hills M',
    28: 'Extreme Hills Plus Trees',
    29: 'Extreme Hills Plus Trees M',
    30: 'Flower Forest',
    31: 'Forest',
    32: 'Forest Hills',
    33: 'Frozen Ocean',
    34: 'Frozen Peaks',
    35: 'Frozen River',
    36: 'Grove',
    37: 'Hell',
    38: 'Ice Mountains',
    39: 'Ice Plains',
    40: 'Ice Plains Spikes',
    41: 'Jagged Peaks',
    42: 'Jungle',
    43: 'Jungle Edge',
    44: 'Jungle Edge M',
    45: 'Jungle Hills',
    46: 'Jungle M',
    47: 'Legacy Frozen Ocean',
    48: 'Lukewarm Ocean',
    49: 'Lush Caves',
    50: 'Mangrove Swamp',
    51: 'Meadow',
    52: 'Mega Taiga',
    53: 'Mega Taiga Hills',
    54: 'Mesa',
    55: 'Mesa Bryce',
    56: 'Mesa Plateau',
    57: 'Mesa Plateau M',
    58: 'Mesa Plateau Stone',
    59: 'Mesa Plateau Stone M',
    60: 'Mushroom Island',
    61: 'Mushroom Island Shore',
    62: 'Ocean',
    63: 'Plains',
    64: 'Redwood Taiga Hills M',
    65: 'Redwood Taiga M',
    66: 'River',
    67: 'Roofed Forest',
    68: 'Roofed Forest M',
    69: 'Savanna',
    70: 'Savanna M',
    71: 'Savanna Plateau',
    72: 'Savanna Plateau M',
    73: 'Snowy Slopes',
    74: 'Soulsand Valley',
    75: 'Stone Beach',
    76: 'Stony Peaks',
    77: 'Sunflower Plains',
    78: 'Swampland',
    79: 'Swampland M',
    80: 'Taiga',
    81: 'Taiga Hills',
    82: 'Taiga M',
    83: 'The End',
    84: 'Warm Ocean',
    85: 'Warped Forest'
};

class ProbeManager {
    constructor() {
        this.probeMap = {};
    }

    addProbe(player) {
        if (this.probeMap[player.id]) return;
        let probe;
        try {
            const entity = player.dimension.spawnEntity('canopy:probe', player.location, { initialPersistence : false });
            probe = new Probe(entity, player);
            this.probeMap[player.id] = probe;
            probe.attachToPlayer();
        } catch (error) {
            if (['LocationInUnloadedChunkError', 'LocationOutOfWorldBoundariesError'].includes(error.name))
                return;
            throw error;
        }
        return probe;
    }

    removeProbe(player) {
        const probe = this.probeMap[player.id];
        if (!probe) return console.warn(`[Probe Manager] Error while removing: No probe found for player ${player?.name}`);
        probe.detachFromPlayer();
        if (probe.entity.isValid())
            probe.entity.remove();
        delete this.probeMap[player.id];
    }

    getProbe(player) {
        return this.probeMap[player.id];
    }

    getProbeByEntity(entity) {
        return Object.values(this.probeMap).find(probe => probe.id === entity.id);
    }

    getProbes() {
        return Object.values(this.probeMap);
    }

    includesProbe(probe) {
        return Object.values(this.probeMap).some(p => p.entity.id === probe.id);
    }
    
    getLightLevel(player) {
        return this.getProperty(player, 'light');
    }

    getBiome(player) {
        return this.biomeToString(this.getProperty(player, 'biome'));
    }

    getProperty(player, property) {
        let result = '?';

        if (this.isHoldingRiptideTrident(player)) {
            this.removeProbe(player);
            return result;
        }

        let probe = this.getProbe(player);
        if (!probe) {
            probe = this.addProbe(player);
            return result;
        } else if (probe.entityInvalid) {
            this.removeProbe(player);
            probe = this.addProbe(player);
            return result;
        }

        const value = probe.getProperty(property);
        return value === -1 ? result : value;
    }

    isHoldingRiptideTrident(player) {
        const equippable = player.getComponent(EntityComponentTypes.Equippable);
        const mainhandItemStack = equippable?.getEquipment(EquipmentSlot.Mainhand);
        if (mainhandItemStack?.typeId === 'minecraft:trident') {
            const enchantable = mainhandItemStack.getComponent(ItemComponentTypes.Enchantable);
            const hasRiptide = enchantable?.hasEnchantment('riptide');
            return hasRiptide;
        }
        return false;
    }

    biomeToString(biomeNumber) {
        if (biomeNumber === '?') return '?';
        return biomeMap[biomeNumber] || 'Unknown Biome';
    }

    startCleanupCycle() {
        world.beforeEvents.playerLeave.subscribe((event) => {
            const player = event.player;
            system.run(() => {
                this.removeProbe(player);
            });
        });

        world.afterEvents.playerDimensionChange.subscribe((event) => {
            const player = event.player;
            this.removeProbe(player);
        });

        system.runInterval(() => {
            const probeEntities = Data.getEntitiesByType('canopy:probe');
            let count = 0;
            for (const probe of probeEntities) {
                if (probe.isValid() && !this.includesProbe(probe)) {
                    try {
                        probe.remove();
                        count++;
                    } catch(error) {
                        console.warn(`[Probe Manager] Failed to remove unused probe ${probe.id}. Error: ${error.message()}`);
                    }
                }
            }
            if (count > 20) console.warn(`[Probe Manager] Large number of unused probes found! Removed ${count} unused probes.`);
        }, CLEANUP_INTERVAL);
    }
}

export default new ProbeManager();