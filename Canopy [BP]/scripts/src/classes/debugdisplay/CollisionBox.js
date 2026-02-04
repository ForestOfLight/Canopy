import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

export class CollisionBox extends DebugDisplayShapeElement {
    collisionBox;
    
    createShapes() {
        const collisionBoxData = this.getCollisionBox();
        const dimensionLocation = { ...collisionBoxData.location, dimension: this.entity.dimension };
        const collisionBox = new DebugBox(dimensionLocation);
        collisionBox.bound = collisionBoxData.size;
        collisionBox.color = { red: 1, green: 1, blue: 1 };
        this.drawShape(collisionBox);
    }

    update() {
        const collisionBoxData = this.getCollisionBox();
        this.shapes[0].bound = collisionBoxData.size;
    }

    getCollisionBox() {
        const AABB = this.entity.getAABB();
        return {
            location: new Vector(0, AABB.extent.y, 0),
            size: Vector.from(AABB.extent).multiply(2)
        };
    }
}