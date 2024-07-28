import { world } from '@minecraft/server';

class EventTracker {
    constructor(eventName, isAfterEvent = true) {
        this.beforeEvents = world.beforeEvents;
        this.afterEvents = world.afterEvents;
        this.eventName = eventName;
        this.isAfterEvent = isAfterEvent;
        this.callback = undefined;
        this.count = 0;
        this.isTracking = false;
        this.setCallback(eventName, isAfterEvent);
    }

    setCallback(eventName, isAfterEvent = true) {
        if (isAfterEvent && this.afterEvents[eventName]) {
            this.callback = this.afterEvents[eventName];
        } else if (this.beforeEvents[eventName]) {
            this.callback = this.beforeEvents[eventName];
        } else {
            throw new Error(`[EventTracker] Event ${eventName} not found. Could not create new tracker.`);
        }
    }

    updateDynamicProperty() {
        const trackedEventsJSON = world.getDynamicProperty('trackedEvents');
        const trackedEvents = trackedEventsJSON ? JSON.parse(trackedEventsJSON) : [];

        let found = false;
        for (let i = 0; i < trackedEvents.length; i++) {
            if (trackedEvents[i].eventName === this.eventName && trackedEvents[i].isAfterEvent === this.isAfterEvent) {
                if (this.isTracking) {
                    trackedEvents[i].count = this.count;
                } else {
                    trackedEvents.splice(i, 1);
                }
                found = true;
                break;
            }
        }
        if (!found && this.isTracking) {
            trackedEvents.push(this.getInfo());
        }

        world.setDynamicProperty('trackedEvents', JSON.stringify(trackedEvents));
    }

    start() {
        this.isTracking = true;
        this.callback.subscribe(this.increment.bind(this));
        this.updateDynamicProperty();
    }

    stop() {
        this.isTracking = false;
        this.callback.unsubscribe(this.increment.bind(this));
        this.updateDynamicProperty();
    }

    increment() {
        this.count++;
        this.updateDynamicProperty();
    }
    
    getCount() {
        return this.count;
    }

    setCount(count) {
        this.count = count;
        this.updateDynamicProperty();
    }
    
    reset() {
        this.count = 0;
        this.updateDynamicProperty();
    }
    
    getInfo() {
        return { eventName: this.eventName, isAfterEvent: this.isAfterEvent, count: this.count };
    }

    getInfoString() {
        return `§7${this.eventName}${this.isAfterEvent ? 'After' : 'Before'}Event:§f ${this.count}`;
    }
}

export default EventTracker;