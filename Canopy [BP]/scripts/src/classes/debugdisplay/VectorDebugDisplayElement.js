import { DebugDisplayElement } from "./DebugDisplayElement";
import { Vector } from "../../../lib/Vector";

export class VectorDebugDisplayElement extends DebugDisplayElement  {
    getFormattedVector(vector) {
        return '§7' + Vector.from(vector).toString();
    }
}