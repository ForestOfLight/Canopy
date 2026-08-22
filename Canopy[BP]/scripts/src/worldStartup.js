import { world, DimensionTypes } from "@minecraft/server";
import { simplayerRejoining } from "./rules/simplayer/simplayerRejoining";
import { understudyInventoryEditor } from "./classes/simplayer/UnderstudyInventoryEditor";
import { ProxyInventoryEntity } from "./classes/proxy/ProxyInventoryEntity";
import { PeekCaptureEntity } from "./classes/peek/PeekCaptureEntity";

let hasStarted = false;

export function startWorldSystems() {
    if (hasStarted)
        return;
    hasStarted = true;
    simplayerRejoining.onStartup();
    understudyInventoryEditor.start();
    sweepInventoryProxies();
}

function sweepInventoryProxies() {
    DimensionTypes.getAll().map(dimensionType => dimensionType.typeId).forEach(dimensionId => {
        ProxyInventoryEntity.sweepOrphans(world.getDimension(dimensionId));
        PeekCaptureEntity.sweepOrphans(world.getDimension(dimensionId));
    });
}
