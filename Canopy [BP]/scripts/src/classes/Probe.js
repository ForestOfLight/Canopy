import { system, EquipmentSlot, EntityComponentTypes } from '@minecraft/server';

class Probe {
    constructor(entity, player) {
        this.assignedPlayer = player;
        this.entity = entity;
        this.attachRunner = null;
    }

    attachToPlayer() {
        this.attachRunner = system.runInterval(() => {
            if (this.entity.isValid()) {
                try {
                    this.entity.teleport(this.getTeleportLocation(), { dimension: this.assignedPlayer.dimension });
                } catch (error) {
                    if (error.message.includes('property \'location\''))
                        return;
                    throw error;
                }
            }
        });
    }
    
    getTeleportLocation() {
        const location = this.assignedPlayer.location;
        const yaw = this.assignedPlayer.getRotation().y;

        const x = location.x + Math.sin(yaw * Math.PI / 180) * .15;
        const z = location.z - Math.cos(yaw * Math.PI / 180) * .15;
        return { x: x, y: location.y, z: z };
    }

    detachFromPlayer() {
        system.clearRun(this.attachRunner);
    }

    getProperty(property) {
        try {
            if (this.isHoldingTrident(this.assignedPlayer))
                return -1;
            return this.entity.getProperty('canopy:' + property);
        } catch (error) {
            return -1;
        }
    }

    isHoldingTrident(player) {
        const equippable = player.getComponent(EntityComponentTypes.Equippable);
        const mainhandItemStack = equippable?.getEquipment(EquipmentSlot.Mainhand);
        return mainhandItemStack?.typeId === 'minecraft:trident';
    }
}

export default Probe;