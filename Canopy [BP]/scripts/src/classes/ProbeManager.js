import { system, world } from "@minecraft/server";
import Probe from "src/classes/Probe";
import Data from "stickycore/data";

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
            if (error.name === 'LocationInUnloadedChunkError')
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
        return this.getProperty(player, 'biome');
    }

    getProperty(player, property) {
        let probe = this.getProbe(player);
        if (!probe) {
            probe = this.addProbe(player);
            return '?';
        }
        let value = probe.getProperty(property);
        if (value === -1) {
            this.removeProbe(player);
            value = '?';
        }
        return value;
    }

    isHoldingTrident(player) {
        const equippable = player.getComponent(EntityComponentTypes.Equippable);
        const mainhandItemStack = equippable?.getEquipment(EquipmentSlot.Mainhand);
        return mainhandItemStack?.typeId === 'minecraft:trident';
    }

    startCleanupCycle() {
        world.beforeEvents.playerLeave.subscribe((event) => {
            const player = event.player;
            const probe = this.getProbe(player)
            system.run(() => {
                this.removeProbe(player);
            });
        });

        system.runInterval(() => {
            const probeEntities = Data.getEntitiesByType('canopy:probe');
            for (const probe of probeEntities) {
                if (probe.isValid() && !this.includesProbe(probe)) {
                    try {
                        probe.remove();
                    } catch(error) {
                        console.warn(`[Probe Manager] Failed to remove unused probe ${probe.id}. Error: ${error.message()}`);
                    }
                }
            }
        }, CLEANUP_INTERVAL);
    }
}

export default new ProbeManager();