import { ProxyInventoryEntity } from "../proxy/ProxyInventoryEntity";
import { getBlockFaceLocationFromRaycastHit } from "./utils";

export const VIEW_DISTANCE = 16 * 64;

export const CARDINAL_ROTATIONS = Object.freeze({
    up: { x: -90, y: 0 }, down: { x: 90, y: 0 }, north: { x: 0, y: 180 },
    south: { x: 0, y: 0 }, east: { x: 0, y: -90 }, west: { x: 0, y: 90 }
});

export function getViewedBlockHit(source) {
    return source.getBlockFromViewDirection({ maxDistance: VIEW_DISTANCE });
}

export function getViewedBlock(source) {
    return getViewedBlockHit(source)?.block;
}

export function getViewedBlockFaceLocation(source) {
    const raycastHit = getViewedBlockHit(source);
    if (raycastHit?.block === void 0)
        return void 0;
    return getBlockFaceLocationFromRaycastHit(raycastHit);
}

export function getViewedEntity(source) {
    return ProxyInventoryEntity.excludeFrom(source.getEntitiesFromViewDirection({ maxDistance: VIEW_DISTANCE }))[0]?.entity;
}
