import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

export class CollisionBox extends DebugDisplayShapeElement {
    createShapes() {
        const collisionBoxData = this.getCollisionBox();
        const dimensionLocation = { ...collisionBoxData.location, dimension: this.entity.dimension };
        const collisionBox = new DebugBox(dimensionLocation);
        collisionBox.bound = collisionBoxData.size;
        collisionBox.color = { red: 1, green: 1, blue: 1 };
        this.drawShape(collisionBox);
    }

    getCollisionBox() {
        const AABB = this.entity.getAABB();
        return {
            location: new Vector(-AABB.extent.x, 0, -AABB.extent.z),
            size: Vector.from(AABB.extent).multiply(2)
        };
    }
}