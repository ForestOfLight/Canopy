import Command from 'stickycore/command'
import * as mc from '@minecraft/server'
import Utils from 'stickycore/utils'

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

new Command()
    .setName('placecamera')
    .setCallback(placeCameraCommand)
    .build()

new Command()
    .setName('pc')
    .setCallback(placeCameraCommand)
    .build()

new Command()
    .setName('viewcamera')
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
    let camera;

    if (!mc.world.getDynamicProperty('placecamera')) return sender.sendMessage('§cThe placecamera feature is disabled.');
    if (sender.getDynamicProperty('isViewingCamera')) return sender.sendMessage('§cYou cannot place a camera while viewing one.');

    camera = new Camera(
        { x: sender.getHeadLocation().x, y: sender.getHeadLocation().y + 0.1, z: sender.getHeadLocation().z },
        sender.getRotation(),
        sender.dimension.id
    );
    placeCamera(sender, camera);
}

function placeCamera(sender, camera) {
    sender.setDynamicProperty('placedCamera', JSON.stringify(camera));
    sender.sendMessage(`§7Camera placed at [${camera.location.x.toFixed(0)}, ${camera.location.y.toFixed(0)}, ${camera.location.z.toFixed(0)}].`);
}

function viewCameraCommand(sender) {
    let placedCamera;

    if (!mc.world.getDynamicProperty('placecamera')) return sender.sendMessage('§cThe placecamera feature is disabled.');
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
    // sender.sendMessage(`§7Now viewing placed camera at ${Utils.stringifyLocation(placedCamera.location, 0)}.`);
}

function endCameraView(sender) {
    sender.camera.fade({
        fadeColor: { red: 0, green: 0, blue: 0 }, 
        fadeTime: { fadeInTime: 0.5, fadeOutTime: 0.5, holdTime: 0.0 }
    });
    mc.system.runTimeout(() => {
        sender.camera.clear();
    }, 8);
    sender.setDynamicProperty('isViewingCamera', false);
    // sender.sendMessage(`§7Stopped viewing placed camera.`);
}
