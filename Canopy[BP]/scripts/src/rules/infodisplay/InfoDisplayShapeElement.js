import { InfoDisplayElement } from './InfoDisplayElement';

class InfoDisplayShapeElement extends InfoDisplayElement {
    constructor(ruleData, isWorldwide = false) {
        const originalOnEnableCallback = ruleData.onEnableCallback;
        ruleData.onEnableCallback = () => {
            this.startRender();
            if (originalOnEnableCallback)
                originalOnEnableCallback();
        };
        const originalOnDisableCallback = ruleData.onDisableCallback;
        ruleData.onDisableCallback = () => {
            this.stopRender();
            if (originalOnDisableCallback)
                originalOnDisableCallback();
        };
        super(ruleData, isWorldwide);
        if (this.constructor === InfoDisplayShapeElement) 
            throw new TypeError("Abstract class 'InfoDisplayShapeElement' cannot be instantiated directly.");
    }

    startRender() {
        this.isRendering = true;
    }

    stopRender() {
        this.isRendering = false;
    }

    onTick() {
        throw new Error("Method 'onTick()' must be implemented.");
    }

    shouldRender() {
        return this.isRendering;
    }
}

export { InfoDisplayShapeElement };
