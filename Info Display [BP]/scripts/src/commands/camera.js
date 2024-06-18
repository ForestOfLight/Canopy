import Command from 'stickycore/command'
import * as mc from '@minecraft/server'

new Command()
    .setName('placeCamera')
    .setCallback(placeCameraCommand)
    .build()

new Command()
    .setName('pc')
    .setCallback(placeCameraCommand)
    .build()

new Command()
    .setName('viewCamera')
    .setCallback(viewCameraCommand)
    .build()

new Command()
    .setName('vc')
    .setCallback(viewCameraCommand)
    .build()

class Camera {
    constructor(location, rotation, dimension) {
        this.location = location;
        this.rotation = rotation;
        this.dimension = dimension;
    }
}

function placeCameraCommand(sender) {
    if (sender.getDynamicProperty('isViewingCamera')) return sender.sendMessage('§cYou cannot place a camera while viewing one.');
    const camera = new Camera({ x: sender.getHeadLocation().x, y: sender.getHeadLocation().y + 0.1, z: sender.getHeadLocation().z }, 
        sender.getRotation(), sender.dimension.id);
    sender.setDynamicProperty('placedCamera', JSON.stringify(camera));
    sender.sendMessage(`§aCamera placed at [${camera.location.x.toFixed(0)}, ${camera.location.y.toFixed(0)}, ${camera.location.z.toFixed(0)}].`);
}

function viewCameraCommand(sender) {
    if (!sender.getDynamicProperty('placedCamera')) return sender.sendMessage('§cYou have not placed a camera yet.');
    const placedCamera = JSON.parse(sender.getDynamicProperty('placedCamera'));

    if (!sender.getDynamicProperty('isViewingCamera')) {
        if (placedCamera.dimension !== sender.dimension.id) return sender.sendMessage(`§cPlease go to ${placedCamera.dimension} to view this camera.`);
        sender.camera.setCamera('minecraft:free', { easeOptions: { easeTime: 1.0, easeType: 'InOutSine' }, 
            location: placedCamera.location, rotation: placedCamera.rotation });
        sender.setDynamicProperty('isViewingCamera', true);
        sender.sendMessage(`Now viewing placed camera at [${placedCamera.location.x.toFixed(0)}, ${placedCamera.location.y.toFixed(0)}, ${placedCamera.location.z.toFixed(0)}].`);
    } else {
        sender.camera.clear();
        sender.setDynamicProperty('isViewingCamera', false);
        sender.sendMessage(`Stopped viewing placed camera.`);
    }
}

mc.world.beforeEvents.playerLeave.subscribe((ev) => {
    const player = ev.player;
    if (!player.getDynamicProperty('isViewingCamera')) return;
    player.setDynamicProperty('isViewingCamera', false);
});

mc.world.afterEvents.playerDimensionChange.subscribe((ev) => {
    const player = ev.player;
    if (!player.getDynamicProperty('isViewingCamera')) return;
    player.camera.clear();
    player.setDynamicProperty('isViewingCamera', false);
});