import { Rule, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, GameMode, Player, system, world } from "@minecraft/server";
import { stringifyLocation } from "../../include/utils";

const MAX_EFFECT_DURATION = 20000000;

new Rule({
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

const CAM_ACTION_ENUM = Object.freeze({
    Place: 'place', 
    View: 'view', 
    Spectate: 'spectate'
});

new VanillaCommand({
    name: 'canopy:cam',
    description: 'commands.camera',
    enums: [{ name: 'canopy:camAction', values: Object.values(CAM_ACTION_ENUM) }],
    mandatoryParameters: [{ name: 'canopy:camAction', type: CustomCommandParamType.Enum }],
    permissionLevel: CommandPermissionLevel.Any,
    contingentRules: ['commandCamera'],
    callback: cameraCommand
});

new VanillaCommand({
    name: 'canopy:cs',
    description: 'commands.camera.spectate',
    usage: 'canopy:cs',
    permissionLevel: CommandPermissionLevel.Any,
    contingentRules: ['commandCamera'],
    callback: (source) => cameraCommand(source, CAM_ACTION_ENUM.Spectate),
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

function cameraCommand(source, action) {
    if (!(source instanceof Player))
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.source.notfound' };
    switch (action) {
        case CAM_ACTION_ENUM.Place:
            placeCameraAction(source);
            break;
        case CAM_ACTION_ENUM.View:
            viewCameraAction(source);
            break;
        case CAM_ACTION_ENUM.Spectate:
            spectateAction(source);
            break;
        default:
            return { status: CustomCommandStatus.Failure, message: 'commands.camera.invalidaction' };
    }
}

function placeCameraAction(source) {
    const eyeHeight = 1.62001002;
    if (source.getDynamicProperty('isViewingCamera'))
        return source.sendMessage({ translate: 'commands.camera.place.viewing' });
    const cameraSettings = {
        location: { x: source.location.x, y: source.location.y + eyeHeight, z: source.location.z },
        rotation: source.getRotation(),
        dimensionId: source.dimension.id
    };
    placeCamera(source, cameraSettings);
}

function placeCamera(source, cameraSettings) {
    source.setDynamicProperty('placedCamera', JSON.stringify(cameraSettings));
    source.sendMessage({ translate: 'commands.camera.place.success', with: [stringifyLocation(cameraSettings.location, 0)] });
}

function viewCameraAction(source) {
    if (source.getDynamicProperty('isSpectating')) 
        return source.sendMessage({ translate: 'commands.camera.view.spectating' });
    if (!source.getDynamicProperty('placedCamera'))
        return source.sendMessage({ translate: 'commands.camera.view.fail' });
    const placedCameraSettings = JSON.parse(source.getDynamicProperty('placedCamera'));
    system.run(() => toggleCameraView(source, placedCameraSettings));
}

function toggleCameraView(source, placedCameraSettings) {
    if (source.getDynamicProperty('isViewingCamera')) {
        endCameraView(source);
    } else {
        if (placedCameraSettings.dimensionId !== source.dimension.id)
            return source.sendMessage({ translate: 'commands.camera.view.dimension', with: [placedCameraSettings.dimensionId] });
        startCameraView(source, placedCameraSettings);
    }
}

function startCameraView(source, placedCameraSettings) {
    source.camera.setCamera('minecraft:free', {
        easeOptions: { easeTime: 1.0, easeType: 'InOutSine' },
        location: placedCameraSettings.location,
        rotation: placedCameraSettings.rotation
    });
    source.setDynamicProperty('isViewingCamera', true);
    source.onScreenDisplay.setActionBar({ translate: 'commands.camera.view.started' });
}

function endCameraView(source) {
    cameraFadeOut(source);
    system.runTimeout(() => {
        source.camera.clear();
    }, 8);
    source.setDynamicProperty('isViewingCamera', false);
    source.onScreenDisplay.setActionBar({ translate: 'commands.camera.view.ended' });
}

function spectateAction(source) {
    if (source.getDynamicProperty('isViewingCamera'))
        return source.sendMessage({ translate: 'commands.camera.spectate.viewing' });
    system.run(() => {
        if (source.getDynamicProperty('isSpectating'))
            endSpectate(source);
        else
            startSpectate(source);
    });
}

function startSpectate(source) {
    cameraFadeOut(source);
    source.setDynamicProperty('isSpectating', true);
    const savedPlayer = new BeforeSpectatorPlayer(source);
    source.setDynamicProperty('beforeSpectatorPlayer', JSON.stringify(savedPlayer));
    
    system.runTimeout(() => {
        source.setGameMode(GameMode.Spectator);
        for (const effect of source.getEffects()) {
            try {
                source.removeEffect(effect.typeId);
            } catch (error) {
                console.warn(`[Canopy] Failed to remove ${effect?.typeId} effect from player ${source.name} while starting spectate. Error: ${error}`);
            }
        }
        source.addEffect('night_vision', MAX_EFFECT_DURATION, { amplifier: 0, showParticles: false });
        source.addEffect('conduit_power', MAX_EFFECT_DURATION, { amplifier: 0, showParticles: false });
        source.onScreenDisplay.setActionBar({ translate: 'commands.camera.spectate.started' });
    }, 8);
}

function endSpectate(source) {
    cameraFadeOut(source);
    const beforeSpectatorPlayer = JSON.parse(source.getDynamicProperty('beforeSpectatorPlayer'));
    source.setDynamicProperty('isSpectating', false);
    system.runTimeout(() => {
        for (const effect of source.getEffects()) {
            try {
                source.removeEffect(effect.typeId);
            } catch (error) {
                console.warn(`[Canopy] Failed to remove ${effect?.typeId} effect from player ${source.name} while ending spectate. Error: ${error}`);
            }
        }
        source.teleport(beforeSpectatorPlayer.location, { dimension: world.getDimension(beforeSpectatorPlayer.dimensionId), rotation: beforeSpectatorPlayer.rotation });
        for (const effect of beforeSpectatorPlayer.effects) {
            try {
                if (effect.duration === -1)
                    effect.duration = MAX_EFFECT_DURATION;
                source.addEffect(effect.typeId, Math.min(MAX_EFFECT_DURATION, effect.duration), { amplifier: effect.amplifier });
            } catch (error) {
                console.warn(`[Canopy] Failed to add ${effect?.typeId} effect back to player ${source.name} while ending spectate. Error: ${error}`);
            }
        }
        source.setGameMode(beforeSpectatorPlayer.gamemode);
        source.onScreenDisplay.setActionBar({ translate: 'commands.camera.spectate.ended' });
    }, 8);
}

function cameraFadeOut(source) {
    source.camera.fade({
        fadeColor: { red: 0, green: 0, blue: 0 },
        fadeTime: { fadeInTime: 0.5, fadeOutTime: 0.5, holdTime: 0.0 }
    });
}
