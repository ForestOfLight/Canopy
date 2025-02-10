import { Rule, Command } from "../../lib/canopy/Canopy";
import { system, world } from "@minecraft/server";
import { stringifyLocation } from "../../include/utils";

new Rule({
    category: 'Rules',
    identifier: 'commandCamera',
    description: { translate: 'rules.commandCamera' },
});

const cmd = new Command({
    name: 'camera',
    description: { translate: 'commands.camera' },
    usage: 'camera <place/view/spectate> [load]',
    args: [
        { type: 'string', name: 'action' },
        { type: 'string', name: 'option' }
    ],
    callback: cameraCommand,
    contingentRules: ['commandCamera'],
    helpEntries: [
        { usage: 'camera place', description: { translate: 'commands.camera.place' } },
        { usage: 'camera view', description: { translate: 'commands.camera.view' } },
        { usage: 'camera view load', description: { translate: 'commands.camera.view.load' } },
        { usage: 'camera spectate', description: { translate: 'commands.camera.spectate' } }
    ]
});

new Command({
    name: 'cp',
    description: { translate: 'commands.camera.place' },
    usage: 'cp',
    callback: (sender) => cameraCommand(sender, { action: 'place' }),
    contingentRules: ['commandCamera'],
    helpHidden: true
});

new Command({
    name: 'cv',
    description: { translate: 'commands.camera.view' },
    usage: 'cv',
    callback: (sender) => cameraCommand(sender, { action: 'view' }),
    contingentRules: ['commandCamera'],
    helpHidden: true
});

new Command({
    name: 'cs',
    description: { translate: 'commands.camera.spectate' },
    usage: 'cs',
    callback: (sender) => cameraCommand(sender, { action: 'spectate' }),
    contingentRules: ['commandCamera'],
    helpHidden: true
});

class BeforeSpectatorPlayer {
    constructor(player) {
        this.location = player.location;
        this.rotation = player.getRotation();
        this.dimensionId = player.dimension.id;
        this.gamemode = player.getGameMode();
        this.effects = [];
        for (const effect of player.getEffects())
            this.effects.push({ typeId: effect.typeId, duration: effect.duration, amplifier: effect.amplifier });
    }
}

world.beforeEvents.playerGameModeChange.subscribe((event) => {
    const player = event.player;
    if (player?.getDynamicProperty('isSpectating') && event.fromGameMode === 'spectator' && event.toGameMode !== 'spectator') {
        system.run(() => {
            player.setGameMode(event.fromGameMode);
            player.onScreenDisplay.setActionBar({ translate: 'commands.camera.spectate.gamemode'});
        });
    }
});

world.beforeEvents.playerLeave.subscribe((event) => {
    event.player?.setDynamicProperty('isViewingCamera', false);
});

world.afterEvents.playerDimensionChange.subscribe((event) => {
    const player = event.player;
    if (!player?.getDynamicProperty('isViewingCamera')) return;
    player.camera.clear();
    player.setDynamicProperty('isViewingCamera', false);
});

function cameraCommand(sender, args) {
    const { action, option } = args;
    
    switch (action) {
        case 'place':
            placeCameraAction(sender);
            break;
        case 'view':
            viewCameraAction(sender, option);
            break;
        case 'spectate':
            spectateAction(sender);
            break;
        default:
            cmd.sendUsage(sender);
            break;
    }
}

function placeCameraAction(sender) {
    const eyeHeight = 1.62001002;

    if (sender.getDynamicProperty('isViewingCamera'))
        return sender.sendMessage({ translate: 'commands.camera.place.viewing' });

    const cameraSettings = {
        location: { x: sender.location.x, y: sender.location.y + eyeHeight, z: sender.location.z },
        rotation: sender.getRotation(),
        dimensionId: sender.dimension.id
    };
    placeCamera(sender, cameraSettings);
}

function placeCamera(sender, cameraSettings) {
    sender.setDynamicProperty('placedCamera', JSON.stringify(cameraSettings));
    sender.sendMessage({ translate: 'commands.camera.place.success', with: [stringifyLocation(cameraSettings.location, 0)] });
}

function viewCameraAction(sender, option) {
    if (sender.getDynamicProperty('isSpectating')) 
        return sender.sendMessage({ translate: 'commands.camera.view.spectating' });
    if (!sender.getDynamicProperty('placedCamera'))
        return sender.sendMessage({ translate: 'commands.camera.view.fail' });

    const placedCameraSettings = JSON.parse(sender.getDynamicProperty('placedCamera'));
    toggleCameraView(sender, placedCameraSettings, option);
}

function toggleCameraView(sender, placedCameraSettings, option) {
    if (sender.getDynamicProperty('isViewingCamera')) {
        endCameraView(sender);
    } else {
        if (placedCameraSettings.dimensionId !== sender.dimension.id)
            return sender.sendMessage({ translate: 'commands.camera.view.dimension', with: [placedCameraSettings.dimensionId] });
        startCameraView(sender, placedCameraSettings, option);
    }
}

function startCameraView(sender, placedCameraSettings, option) {
    if (option === 'load')
        loadChunkForTicks(placedCameraSettings, 20);
    sender.camera.setCamera('minecraft:free', {
        easeOptions: { easeTime: 1.0, easeType: 'InOutSine' },
        location: placedCameraSettings.location,
        rotation: placedCameraSettings.rotation
    });
    sender.setDynamicProperty('isViewingCamera', true);
    sender.onScreenDisplay.setActionBar({ translate: 'commands.camera.view.started' });
}

function loadChunkForTicks(placedCameraSettings, ticks) {
    const dimension = world.getDimension(placedCameraSettings.dimensionId);
    dimension.runCommand('tickingarea remove Canopy-cameraLoad');
    dimension.runCommand(`tickingarea add ${placedCameraSettings.location.x} ${placedCameraSettings.location.y} ${placedCameraSettings.location.z} ${placedCameraSettings.location.x} ${placedCameraSettings.location.y} ${placedCameraSettings.location.z} Canopy-cameraLoad`);
    system.runTimeout(() => {
        dimension.runCommand('tickingarea remove Canopy-cameraLoad');
    }, ticks);
}

function endCameraView(sender) {
    cameraFadeOut(sender);
    system.runTimeout(() => {
        sender.camera.clear();
    }, 8);
    sender.setDynamicProperty('isViewingCamera', false);
    sender.onScreenDisplay.setActionBar({ translate: 'commands.camera.view.ended' });
}

function spectateAction(sender) {
    if (sender.getDynamicProperty('isViewingCamera'))
        return sender.sendMessage({ translate: 'commands.camera.spectate.viewing' });
    if (sender.getDynamicProperty('isSpectating'))
        endSpectate(sender);
    else
        startSpectate(sender);
}

function startSpectate(sender) {
    cameraFadeOut(sender);
    sender.setDynamicProperty('isSpectating', true);
    const savedPlayer = new BeforeSpectatorPlayer(sender);
    sender.setDynamicProperty('beforeSpectatorPlayer', JSON.stringify(savedPlayer));
    
    system.runTimeout(() => {
        sender.setGameMode('spectator');
        for (const effect of sender.getEffects())
            sender.removeEffect(effect?.typeId);
        sender.addEffect('night_vision', 20000000, { amplifier: 0, showParticles: false });
        sender.addEffect('conduit_power', 20000000, { amplifier: 0, showParticles: false });
        sender.onScreenDisplay.setActionBar({ translate: 'commands.camera.spectate.started' });
    }, 8);
}

function endSpectate(sender) {
    cameraFadeOut(sender);
    const beforeSpectatorPlayer = JSON.parse(sender.getDynamicProperty('beforeSpectatorPlayer'));
    sender.setDynamicProperty('isSpectating', false);
    system.runTimeout(() => {
        for (const effect of sender.getEffects()) {
            if (!effect) continue;
            sender.removeEffect(effect.typeId);
        }
        sender.teleport(beforeSpectatorPlayer.location, { dimension: world.getDimension(beforeSpectatorPlayer.dimensionId), rotation: beforeSpectatorPlayer.rotation });
        for (const effect of beforeSpectatorPlayer.effects) {
            try {
                sender.addEffect(effect.typeId, Math.min(20000000, effect.duration), { amplifier: effect.amplifier });
            } catch (error) {
                console.warn(`Failed to add effect back to player ${sender.name}. Error: ${error}`);
            }
        }
        sender.setGameMode(beforeSpectatorPlayer.gamemode);
        sender.onScreenDisplay.setActionBar({ translate: 'commands.camera.spectate.ended' });
    }, 8);
}

function cameraFadeOut(sender) {
    sender.camera.fade({
        fadeColor: { red: 0, green: 0, blue: 0 },
        fadeTime: { fadeInTime: 0.5, fadeOutTime: 0.5, holdTime: 0.0 }
    });
}
