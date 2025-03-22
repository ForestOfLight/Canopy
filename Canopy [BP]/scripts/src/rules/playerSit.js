import { DimensionTypes, system, world, InputButton, ButtonState } from "@minecraft/server";
import { Rules, Rule } from "../../lib/canopy/Canopy";

const SNEAK_COUNT = 3;
const SNEAK_SPEED = 4*50;

new Rule({
    category: 'Rules',
    identifier: 'playerSit',
    description: { translate: 'rules.playerSit', with: [SNEAK_COUNT.toString()] },
});

const playerSneaks = {};

system.runInterval(() => {
    if (!Rules.getNativeValue('playerSit')) return;
    world.getAllPlayers().forEach(player => {
        if (isPlayerSneaking(player))
            handlePlayerSneak(player);
    });
    cleanupRideableEntities();
});

function isPlayerSneaking(player) {
    return player && player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
}

function handlePlayerSneak(player) {
    const currentTime = Date.now();
    const sneakTracker = playerSneaks[player.id] || { count: 0, lastTime: currentTime, lastTick: system.currentTick };
    if (sneakTracker.lastTick === system.currentTick - 1) {
        sneakTracker.lastTime = currentTime;
        sneakTracker.lastTick = system.currentTick;
        return;
    }
    if (player.isOnGround && currentTime - sneakTracker.lastTime < SNEAK_SPEED) {
        sneakTracker.count++;
        if (sneakTracker.count >= SNEAK_COUNT) {
            sit(player);
            sneakTracker.count = 0;
        }
    } else {
        sneakTracker.count = 1;
    }
    sneakTracker.lastTime = currentTime;
    sneakTracker.lastTick = system.currentTick;
    playerSneaks[player.id] = sneakTracker;
}

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