import { VanillaCommand, PlayerCommandOrigin, BooleanRule } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, GameMode, system, world } from "@minecraft/server";
import { stringifyLocation } from "../../include/utils";

const MAX_EFFECT_DURATION = 20000000;
const TICKS_TO_COMPLETE_FADE = 10;

new BooleanRule({
    category: 'Rules',
    identifier: 'commandCamera',
    description: { translate: 'rules.commandCamera' },
    onEnableCallback: () => {
        world.afterEvents.playerGameModeChange.subscribe(onPlayerGameModeChange);
        world.beforeEvents.playerLeave.subscribe(onPlayerLeave);
        world.afterEvents.playerDimensionChange.subscribe(onPlayerDimensionChange);
    },
    onDisableCallback: () => {
        world.afterEvents.playerGameModeChange.unsubscribe(onPlayerGameModeChange);
        world.beforeEvents.playerLeave.unsubscribe(onPlayerLeave);
        world.afterEvents.playerDimensionChange.unsubscribe(onPlayerDimensionChange);
    }
});

const CAM_ACTIONS = Object.freeze({
    Place: 'place', 
    View: 'view', 
    Spectate: 'spectate'
});

new VanillaCommand({
    name: 'canopy:cam',
    description: 'commands.camera',
    enums: [{ name: 'canopy:camAction', values: Object.values(CAM_ACTIONS) }],
    mandatoryParameters: [{ name: 'canopy:camAction', type: CustomCommandParamType.Enum }],
    permissionLevel: CommandPermissionLevel.Any,
    contingentRules: ['commandCamera'],
    allowedSources: [PlayerCommandOrigin],
    callback: cameraCommand
});

new VanillaCommand({
    name: 'canopy:cs',
    description: 'commands.camera.spectate',
    usage: 'canopy:cs',
    permissionLevel: CommandPermissionLevel.Any,
    contingentRules: ['commandCamera'],
    allowedSources: [PlayerCommandOrigin],
    callback: (origin) => cameraCommand(origin, CAM_ACTIONS.Spectate),
});

class BeforeSpectatorPlayer {
    constructor(player) {
        this.location = player.location;
        this.rotation = player.getRotation();
        this.dimensionId = player.dimension.id;
        this.gamemode = player.getGameMode();
        this.effects = player.getEffects().map(effect => ({ typeId: effect.typeId, duration: effect.duration, amplifier: effect.amplifier }));
    }
}

function onPlayerGameModeChange(event) {
    const player = event.player;
    if (player?.getDynamicProperty('isSpectating') && event.fromGameMode === GameMode.Spectator && event.toGameMode !== GameMode.Spectator) {
        system.run(() => {
            player.setGameMode(event.fromGameMode);
            player.onScreenDisplay.setActionBar({ translate: 'commands.camera.spectate.gamemode'});
        });
    }
}

function onPlayerLeave(event) {
    event.player?.setDynamicProperty('isViewingCamera', false);
}

function onPlayerDimensionChange(event) {
    const player = event.player;
    if (!player?.getDynamicProperty('isViewingCamera')) return;
    player.camera.clear();
    player.setDynamicProperty('isViewingCamera', false);
}

function cameraCommand(origin, action) {
    const player = origin.getSource();
    switch (action) {
        case CAM_ACTIONS.Place:
            placeCameraAction(player);
            break;
        case CAM_ACTIONS.View:
            viewCameraAction(player);
            break;
        case CAM_ACTIONS.Spectate:
            spectateAction(player);
            break;
        default:
            return { status: CustomCommandStatus.Failure, message: 'commands.camera.invalidaction' };
    }
}

function placeCameraAction(player) {
    const eyeHeight = 1.62001002;
    if (player.getDynamicProperty('isViewingCamera'))
        return player.sendMessage({ translate: 'commands.camera.place.viewing' });
    const cameraSettings = {
        location: { x: player.location.x, y: player.location.y + eyeHeight, z: player.location.z },
        rotation: player.getRotation(),
        dimensionId: player.dimension.id
    };
    placeCamera(player, cameraSettings);
}

function placeCamera(player, cameraSettings) {
    player.setDynamicProperty('placedCamera', JSON.stringify(cameraSettings));
    player.sendMessage({ translate: 'commands.camera.place.success', with: [stringifyLocation(cameraSettings.location, 0)] });
}

function viewCameraAction(player) {
    if (player.getDynamicProperty('isSpectating')) 
        return player.sendMessage({ translate: 'commands.camera.view.spectating' });
    if (!player.getDynamicProperty('placedCamera'))
        return player.sendMessage({ translate: 'commands.camera.view.fail' });
    const placedCameraSettings = JSON.parse(player.getDynamicProperty('placedCamera'));
    system.run(() => toggleCameraView(player, placedCameraSettings));
}

function toggleCameraView(player, placedCameraSettings) {
    if (player.getDynamicProperty('isViewingCamera')) {
        endCameraView(player);
    } else {
        if (placedCameraSettings.dimensionId !== player.dimension.id)
            return player.sendMessage({ translate: 'commands.camera.view.dimension', with: [placedCameraSettings.dimensionId] });
        startCameraView(player, placedCameraSettings);
    }
}

function startCameraView(player, placedCameraSettings) {
    player.camera.setCamera('minecraft:free', {
        easeOptions: { easeTime: 1.0, easeType: 'InOutSine' },
        location: placedCameraSettings.location,
        rotation: placedCameraSettings.rotation
    });
    player.setDynamicProperty('isViewingCamera', true);
    player.onScreenDisplay.setActionBar({ translate: 'commands.camera.view.started' });
}

function endCameraView(player) {
    cameraFadeOut(player);
    system.runTimeout(() => {
        player.camera.clear();
    }, TICKS_TO_COMPLETE_FADE);
    player.setDynamicProperty('isViewingCamera', false);
    player.onScreenDisplay.setActionBar({ translate: 'commands.camera.view.ended' });
}

function spectateAction(player) {
    system.run(() => {
        if (player.getDynamicProperty('isSpectating')) {
            endSpectate(player);
        } else {
            try {
                startSpectate(player);
            } catch (error) {
                player.sendMessage({ translate: error.message });
                player.setDynamicProperty('isSpectating', false);
            }
        }
    });
}

function startSpectate(player) {
    if (world.isHardcore)
        throw new Error('commands.camera.spectate.hardcore');
    if (player.getDynamicProperty('isViewingCamera'))
        throw new Error('commands.camera.spectate.viewing');
    if (!player.isOnGround && player.getGameMode() !== GameMode.Creative)
        throw new Error('commands.camera.spectate.flying');
    cameraFadeOut(player);
    player.setDynamicProperty('isSpectating', true);
    const savedPlayer = new BeforeSpectatorPlayer(player);
    player.setDynamicProperty('beforeSpectatorPlayer', JSON.stringify(savedPlayer));
    
    system.runTimeout(() => {
        player.setGameMode(GameMode.Spectator);
        for (const effect of player.getEffects()) {
            try {
                player.removeEffect(effect.typeId);
            } catch (error) {
                console.warn(`[Canopy] Failed to remove ${effect?.typeId} effect from player ${player.name} while starting spectate. Error: ${error}`);
            }
        }
        player.addEffect('night_vision', MAX_EFFECT_DURATION, { amplifier: 0, showParticles: false });
        player.addEffect('conduit_power', MAX_EFFECT_DURATION, { amplifier: 0, showParticles: false });
        player.onScreenDisplay.setActionBar({ translate: 'commands.camera.spectate.started' });
    }, TICKS_TO_COMPLETE_FADE);
}

function endSpectate(player) {
    cameraFadeOut(player);
    const beforeSpectatorPlayer = JSON.parse(player.getDynamicProperty('beforeSpectatorPlayer'));
    player.setDynamicProperty('isSpectating', false);
    system.runTimeout(() => {
        for (const effect of player.getEffects()) {
            try {
                player.removeEffect(effect.typeId);
            } catch (error) {
                console.warn(`[Canopy] Failed to remove ${effect?.typeId} effect from player ${player.name} while ending spectate. Error: ${error}`);
            }
        }
        player.teleport(beforeSpectatorPlayer.location, { dimension: world.getDimension(beforeSpectatorPlayer.dimensionId), rotation: beforeSpectatorPlayer.rotation });
        for (const effect of beforeSpectatorPlayer.effects) {
            try {
                if (effect.duration === -1)
                    effect.duration = MAX_EFFECT_DURATION;
                player.addEffect(effect.typeId, Math.min(MAX_EFFECT_DURATION, effect.duration), { amplifier: effect.amplifier });
            } catch (error) {
                console.warn(`[Canopy] Failed to add ${effect?.typeId} effect back to player ${player.name} while ending spectate. Error: ${error}`);
            }
        }
        player.setGameMode(beforeSpectatorPlayer.gamemode);
        player.onScreenDisplay.setActionBar({ translate: 'commands.camera.spectate.ended' });
    }, TICKS_TO_COMPLETE_FADE);
}

function cameraFadeOut(player) {
    player.camera.fade({
        fadeColor: { red: 0, green: 0, blue: 0 },
        fadeTime: { fadeInTime: 0.5, fadeOutTime: 0.5, holdTime: 0.0 }
    });
}
