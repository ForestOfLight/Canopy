import Command from 'stickycore/command'
import * as mc from '@minecraft/server'

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
    .setName('camera')
    .addArgument('string', 'action')
    .setCallback(cameraCommand)
    .build()

new Command()
    .setName('cp')
    .setCallback((sender) => cameraCommand(sender, 'place'))
    .build()

new Command()
    .setName('cv')
    .setCallback((sender) => cameraCommand(sender, 'view'))
    .build()

class Camera {
    constructor(location, rotation, dimension) {
        this.location = location;
        this.rotation = rotation;
        this.dimension = dimension;
    }
}

function cameraCommand(sender, args) {
    const { action } = args;
    if (!mc.world.getDynamicProperty('placecamera')) return sender.sendMessage('§cThe placecamera feature is disabled.');

    switch (action) {
        case 'place':
            placeCameraAction(sender);
            break;
        case 'view':
            viewCameraAction(sender);
            break;
        default:
            sender.sendMessage('§cUsage: ./camera <place/view>');
            break;
    }
}

function placeCameraAction(sender) {
    let camera;

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

function viewCameraAction(sender) {
    let placedCamera;

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
}
