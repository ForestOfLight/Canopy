import { system, world, EquipmentSlot, EntityComponentTypes, ItemComponentTypes } from "@minecraft/server";
import Probe from "src/classes/Probe";
import Utils from "include/utils";
import { intToBiomeMap } from "include/data";

const CLEANUP_INTERVAL = 10 * 20;

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
        if (!probe) return;
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

        if (this.isDoingBannedAction(player)) {
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

    isDoingBannedAction(player) {
        // Trident with Riptide
        const equippable = player.getComponent(EntityComponentTypes.Equippable);
        const mainhandItemStack = equippable?.getEquipment(EquipmentSlot.Mainhand);
        if (mainhandItemStack?.typeId === 'minecraft:trident') {
            const enchantable = mainhandItemStack.getComponent(ItemComponentTypes.Enchantable);
            const hasRiptide = enchantable?.hasEnchantment('riptide');
            return hasRiptide;
        }
        // Riding an entity
        const riding = player.getComponent(EntityComponentTypes.Riding);
        if (riding?.entityRidingOn)
            return true;
        return false;
    }

    biomeToString(biomeNumber) {
        if (biomeNumber === '?') return '?';
        return intToBiomeMap[biomeNumber] || 'Unknown Biome';
    }

    startCleanupCycle() {
        world.beforeEvents.playerLeave.subscribe((event) => {
            const player = event.player;
            system.run(() => {
                try {
                    if (player?.getDynamicProperty('light') || player?.getDynamicProperty('biome'))
                        this.removeProbe(player);
                } catch {}
            });
        });

        world.afterEvents.playerDimensionChange.subscribe((event) => {
            const player = event.player;
            if (player?.getDynamicProperty('light') || player?.getDynamicProperty('biome'))
                this.removeProbe(player);
        });

        system.runInterval(() => {
            const probeEntities = Utils.getEntitiesByType('canopy:probe');
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
            if (count > 100) console.warn(`[Probe Manager] Large number of unused probes found! Removed ${count} unused probes.`);
        }, CLEANUP_INTERVAL);
    }
}

export default new ProbeManager();