import { debugDrawer, DebugBox, DebugText } from '@minecraft/debug-utilities';

export class AnalyzeAreaRenderer {
    dimension;
    min;
    max;
    locations;
    statsText;
    outlineShape;
    textShape;
    matchShapes;
    matchesVisible;

    constructor(dimension, min, max, locations, statsText) {
        this.dimension = dimension;
        this.min = min;
        this.max = max;
        this.locations = locations;
        this.statsText = statsText;
        this.outlineShape = void 0;
        this.textShape = void 0;
        this.matchShapes = [];
        this.matchesVisible = false;
    }

    showOutline() {
        if (this.outlineShape)
            return;
        const center = {
            x: (this.min.x + this.max.x + 1) / 2,
            y: (this.min.y + this.max.y + 1) / 2,
            z: (this.min.z + this.max.z + 1) / 2,
            dimension: this.dimension
        };
        const box = new DebugBox(center);
        box.bound = {
            x: this.max.x - this.min.x + 1,
            y: this.max.y - this.min.y + 1,
            z: this.max.z - this.min.z + 1
        };
        box.color = { red: 1, green: 1, blue: 1, alpha: 1 };
        this.outlineShape = box;
        debugDrawer.addShape(box);

        const text = new DebugText(center, this.statsText);
        this.textShape = text;
        debugDrawer.addShape(text);
    }

    setText(statsText) {
        this.statsText = { rawtext: [ { translate: "commands.analyzearea.stats.header" }, { text: '\n' }, statsText] };
        if (this.textShape)
            this.textShape.setText(this.statsText);
    }

    hideOutline() {
        if (this.outlineShape) {
            this.outlineShape.remove();
            this.outlineShape = void 0;
        }
        if (this.textShape) {
            this.textShape.remove();
            this.textShape = void 0;
        }
    }

    showMatches() {
        if (this.matchesVisible)
            return;
        for (const loc of this.locations) {
            const center = { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5, dimension: this.dimension };
            const box = new DebugBox(center);
            box.bound = { x: 1, y: 1, z: 1 };
            box.color = { red: 0, green: 1, blue: 0, alpha: 1 };
            this.matchShapes.push(box);
            debugDrawer.addShape(box);
        }
        this.matchesVisible = true;
    }

    hideMatches() {
        for (const shape of this.matchShapes) shape.remove();
        this.matchShapes = [];
        this.matchesVisible = false;
    }

    destroy() {
        this.hideOutline();
        this.hideMatches();
    }
}
