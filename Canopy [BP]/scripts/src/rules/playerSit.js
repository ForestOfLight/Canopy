import { DimensionTypes, system, world } from "@minecraft/server";
import { Rules, Rule } from "../../lib/canopy/Canopy";

const SNEAK_COUNT = 3;
const SNEAK_SPEED = 4;

new Rule({
    category: 'Rules',
    identifier: 'playerSit',
    description: { translate: 'rules.playerSit', with: [SNEAK_COUNT.toString()] },
});

const playerSneaks = {};

system.runInterval(() => {
    if (!Rules.getNativeValue('playerSit')) return;
    world.getAllPlayers().forEach(player => {
        if (player?.isSneaking) {
            const currentTime = system.currentTick;
            const sneakInfo = playerSneaks[player.id] || { count: 0, lastTime: currentTime };
            if (sneakInfo.lastTime === currentTime - 1) {
                sneakInfo.lastTime = currentTime;
                return;
            }
            if (player.isOnGround && currentTime - sneakInfo.lastTime < SNEAK_SPEED) {
                sneakInfo.count++;
                if (sneakInfo.count >= SNEAK_COUNT) {
                    sit(player);
                    sneakInfo.count = 0;
                }
            } else {
                sneakInfo.count = 1;
            }
            sneakInfo.lastTime = currentTime;
            playerSneaks[player.id] = sneakInfo;
        }
    });
    cleanupRideableEntities();
});

function sit(player) {
    const heightAdjustment = -0.12;
    const entityLocation = { x: player.location.x, y: player.location.y + heightAdjustment, z: player.location.z };
    const rideableEntity = player.dimension.spawnEntity('canopy:rideable', entityLocation);
    rideableEntity.setRotation(player.getRotation());
    rideableEntity.getComponent('rideable').addRider(player);
}

function cleanupRideableEntities() {
    DimensionTypes.getAll().forEach((dimensionType) => {
        world.getDimension(dimensionType.typeId).getEntities({ type: 'canopy:rideable' }).forEach(entity => {
            if (entity.getComponent('rideable').getRiders().length === 0)
                entity.remove();
        });
    });
}

export { sit };