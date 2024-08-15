import { Rule, Command } from 'lib/canopy/Canopy';
import { system, world } from '@minecraft/server'

class CameraPlacement {
    constructor(location, rotation, dimension) {
        this.location = location;
        this.rotation = rotation;
        this.dimension = dimension;
    }
}

class BeforeSpectatorPlayer {
    constructor(player) {
        this.location = player.location;
        this.rotation = player.getRotation();
        this.dimensionId = player.dimension.id;
        this.gamemode = player.getGameMode();
        this.effects = [];
        for (let effect of player.getEffects())
            this.effects.push({ typeId: effect.typeId, duration: effect.duration, amplifier: effect.amplifier });
    }
}

new Rule({
    identifier: 'commandCamera',
    description: 'Allow the use of the camera command.',
});

const cmd = new Command({
    name: 'camera',
    description: 'Place a camera, view it, or use a survival-friendly spectator mode.',
    usage: 'camera <place/view/spectate>',
    args: [
        { type: 'string', name: 'action' }
    ],
    callback: cameraCommand,
    contingentRules: ['commandCamera']
});

new Command({
    name: 'cp',
    description: 'Place a camera at your current location.',
    usage: 'cp',
    callback: (sender) => cameraCommand(sender, { action: 'place' }),
    contingentRules: ['commandCamera']
});

new Command({
    name: 'cv',
    description: 'View the camera you placed.',
    usage: 'cv',
    callback: (sender) => cameraCommand(sender, { action: 'view' }),
    contingentRules: ['commandCamera']
});

new Command({
    name: 'cs',
    description: 'Toggle a survival-friendly spectator mode.',
    usage: 'cs',
    callback: (sender) => cameraCommand(sender, { action: 'spectate' }),
    contingentRules: ['commandCamera']
});

world.beforeEvents.playerGameModeChange.subscribe((ev) => {
    const player = ev.player;
    if (player.getDynamicProperty('isSpectating') && ev.fromGameMode === 'spectator' && ev.toGameMode !== 'spectator') {
        system.run(() => {
            player.setGameMode(ev.fromGameMode);
            player.onScreenDisplay.setActionBar('§cYou cannot change your gamemode while spectating.');
        });
    }
});

world.beforeEvents.playerLeave.subscribe((ev) => {
    ev.player.setDynamicProperty('isViewingCamera', false);
});

world.afterEvents.playerDimensionChange.subscribe((ev) => {
    const player = ev.player;
    if (!player.getDynamicProperty('isViewingCamera')) return;
    player.camera.clear();
    player.setDynamicProperty('isViewingCamera', false);
});

function cameraCommand(sender, args) {
    const { action } = args;
    
    switch (action) {
        case 'place':
            placeCameraAction(sender);
            break;
        case 'view':
            viewCameraAction(sender);
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
    let camera;
    let eyeHeight = 1.62001002;

    if (sender.getDynamicProperty('isViewingCamera')) return sender.sendMessage('§cYou cannot place a camera while viewing one.');

    camera = new CameraPlacement(
        { x: sender.location.x, y: sender.location.y + eyeHeight, z: sender.location.z },
        sender.getRotation(),
        sender.dimension.id
    );
    placeCamera(sender, camera);
}

function placeCamera(sender, camera) {
    sender.setDynamicProperty('placedCamera', JSON.stringify(camera));
    sender.sendMessage(`§7Camera placed at [${camera.location.x.toFixed(0)}, ${camera.location.y.toFixed(0)}, ${camera.location.z.toFixed(0)}].`);
}

function viewCameraAction(sender) {
    let placedCamera;

    if (sender.getDynamicProperty('isSpectating')) return sender.sendMessage('§cYou cannot view a camera while spectating.');
    if (!sender.getDynamicProperty('placedCamera')) return sender.sendMessage('§cYou have not placed a camera yet.');

    placedCamera = JSON.parse(sender.getDynamicProperty('placedCamera'));
    toggleCameraView(sender, placedCamera);
}

function toggleCameraView(sender, placedCamera) {
    if (!sender.getDynamicProperty('isViewingCamera')) {
        if (placedCamera.dimension !== sender.dimension.id) return sender.sendMessage(`§cPlease go to ${placedCamera.dimension} to view this camera.`);
        startCameraView(sender, placedCamera);
    } else {
        endCameraView(sender);
    }
}

function startCameraView(sender, placedCamera) {
    sender.camera.setCamera('minecraft:free', {
        easeOptions: { easeTime: 1.0, easeType: 'InOutSine' },
        location: placedCamera.location,
        rotation: placedCamera.rotation
    });
    sender.setDynamicProperty('isViewingCamera', true);
    sender.onScreenDisplay.setActionBar('§aViewing camera');
}

function endCameraView(sender) {
    cameraFadeOut(sender);
    system.runTimeout(() => {
        sender.camera.clear();
    }, 8);
    sender.setDynamicProperty('isViewingCamera', false);
    sender.onScreenDisplay.setActionBar('§7Camera view ended');
}

function spectateAction(sender) {
    if (sender.getDynamicProperty('isViewingCamera')) return sender.sendMessage('§cYou cannot spectate while viewing a camera.');
    if (!sender.getDynamicProperty('isSpectating'))
        startSpectate(sender);
    else
        endSpectate(sender);
}

function startSpectate(sender) {
    cameraFadeOut(sender);
    sender.setDynamicProperty('isSpectating', true);
    const savedPlayer = new BeforeSpectatorPlayer(sender);
    sender.setDynamicProperty('beforeSpectatorPlayer', JSON.stringify(savedPlayer));
    
    system.runTimeout(() => {
        sender.setGameMode('spectator');
        for (let effect of sender.getEffects())
            sender.removeEffect(effect.typeId);
        sender.addEffect('night_vision', 999999, { amplifier: 0, showParticles: false });
        sender.addEffect('conduit_power', 999999, { amplifier: 0, showParticles: false });
        sender.onScreenDisplay.setActionBar('§aSpectating');
    }, 8);
}

function endSpectate(sender) {
    cameraFadeOut(sender);
    const beforeSpectatorPlayer = JSON.parse(sender.getDynamicProperty('beforeSpectatorPlayer'));
    sender.setDynamicProperty('isSpectating', false);
    system.runTimeout(() => {
        for (let effect of sender.getEffects())
            sender.removeEffect(effect.typeId);
        sender.teleport(beforeSpectatorPlayer.location, { dimension: world.getDimension(beforeSpectatorPlayer.dimensionId), rotation: beforeSpectatorPlayer.rotation });
        for (const effect of beforeSpectatorPlayer.effects)
            sender.addEffect(effect.typeId, effect.duration, { amplifier: effect.amplifier });
        sender.setGameMode(beforeSpectatorPlayer.gamemode);
        sender.onScreenDisplay.setActionBar('§7Spectating ended');
    }, 8);
}

function cameraFadeOut(sender) {
    sender.camera.fade({
        fadeColor: { red: 0, green: 0, blue: 0 }, 
        fadeTime: { fadeInTime: 0.5, fadeOutTime: 0.5, holdTime: 0.0 }
    });
}
