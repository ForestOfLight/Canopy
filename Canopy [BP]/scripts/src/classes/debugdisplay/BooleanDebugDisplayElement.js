import { DebugDisplayTextElement } from "./DebugDisplayTextElement";

export class BooleanDebugDisplayElement extends DebugDisplayTextElement  {
    getFormattedBoolean(bool) {
        return '§3' + String(bool);
    }
}