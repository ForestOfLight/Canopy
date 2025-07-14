import { system } from "@minecraft/server";

export class Event {
    runner;
    callbacks = [];

    constructor() {
        this.callbacks = [];
    }

    subscribe(callback) {
        if (!this.isTracking())
            this.startTrackingEvent(callback);
        this.callbacks.push(callback);
    }
    
    unsubscribe(callback) {
        this.removeCallback(callback);
        if (this.callbacks.length === 0)
            this.stopTrackingEvent();
    }

    startTrackingEvent() {
        this.runner = system.runInterval(this.onTick.bind(this));
    }

    onTick() {
        this.sendEvents(this.provideEvents());
    }

    provideEvents() {
        throw new Error("Method 'provideEvents()' must be implemented.");
    }

    sendEvents(events) {
        if (events.length === 0)
            return;
        this.callbacks.forEach(callback => {
            events.forEach(event => {
                callback(event);
            });
        });
    }

    removeCallback(callback) {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }

    isTracking() {
        return this.callbacks.length > 0;
    }

    stopTrackingEvent() {
        system.clearRun(this.runner);
    }
}