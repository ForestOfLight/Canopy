import { DebugDisplayElement } from "./DebugDisplayElement";

export class BooleanDebugDisplayElement extends DebugDisplayElement  {
    getFormattedBoolean(bool) {
        return '§3' + String(bool);
    }
}