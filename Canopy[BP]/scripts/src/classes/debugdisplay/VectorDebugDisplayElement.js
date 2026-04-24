import { DebugDisplayTextElement } from "./DebugDisplayTextElement";

export class VectorDebugDisplayElement extends DebugDisplayTextElement  {
    getFormattedVector(vector, { colorCode = '§7', precision = 4 } = {}) {
        return colorCode + `<${vector.x.toFixed(precision)}, ${vector.y.toFixed(precision)}, ${vector.z.toFixed(precision)}>`;
    }
}