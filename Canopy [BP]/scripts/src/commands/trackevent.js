import { VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system, world } from "@minecraft/server";
import EventTracker from "../classes/EventTracker";

const EVENT_TYPES = Object.freeze({
    Before: 'beforeEvent',
    After: 'afterEvent'
});

function getAllWorldEventNames() {
    const beforeEventNames = [];
    const afterEventNames = [];
    for (const prop in world.beforeEvents)
        beforeEventNames.push(prop);
    for (const prop in world.afterEvents)
        afterEventNames.push(prop);
    return Array.from(new Set(beforeEventNames.concat(afterEventNames)));
}
    
new VanillaCommand({
    name: 'canopy:trackevent',
    description: 'commands.trackevent',
    enums: [
        { name: 'canopy:eventName', values: getAllWorldEventNames() },
        { name: 'canopy:eventType', values: Object.values(EVENT_TYPES) }
    ],
    mandatoryParameters: [{ name: 'canopy:eventName', type: CustomCommandParamType.Enum }],
    optionalParameters: [{ name: 'canopy:eventType', type: CustomCommandParamType.Enum }],
    permissionLevel: CommandPermissionLevel.Any,
    callback: trackCommand
});

const trackers = {
    before: {},
    after: {}
};

world.afterEvents.worldLoad.subscribe(() => {
    const trackedEventsJSON = world.getDynamicProperty('trackedEvents')
    const trackedEvents = trackedEventsJSON ? JSON.parse(trackedEventsJSON) : [];
    for (const savedTracker of trackedEvents) {
        const tracker = new EventTracker(savedTracker.eventName, savedTracker.isAfterEvent, savedTracker.count);
        tracker.start();
        tracker.setCount(savedTracker.count);
        trackers[savedTracker.isAfterEvent ? 'after' : 'before'][savedTracker.eventName] = tracker;
    }
});

function trackCommand(source, eventName, eventType) {
    let isAfterEvent;
    if (eventType === EVENT_TYPES.Before)
        isAfterEvent = false;
    else if (!eventType || eventType === EVENT_TYPES.After)
        isAfterEvent = true;
    else
        return { status: CustomCommandStatus.Failure, message: 'commands.trackevent.invalid' };
    system.run(() => {
        if (alreadyTracking(eventName, isAfterEvent))
            stopTracking(source, eventName, isAfterEvent);
        else
            startTracking(source, eventName, isAfterEvent);
    });
}

function alreadyTracking(eventName, isAfterEvent) {
    return (isAfterEvent && trackers.after[eventName]) || (!isAfterEvent && trackers.before[eventName]);
}

function stopTracking(source, eventName, isAfterEvent) {
    if (!isValidEvent(source, eventName, isAfterEvent))
        return;
    const tracker = trackers[isAfterEvent ? 'after' : 'before'][eventName];
    tracker.stop();
    delete trackers[isAfterEvent ? 'after' : 'before'][eventName];
    const eventFullName = eventName + (isAfterEvent ? 'After' : 'Before') + 'Event';
    source.sendMessage({ translate: 'commands.trackevent.stop', with: [eventFullName] });
}

function startTracking(source, eventName, isAfterEvent) {
    if (!isValidEvent(source, eventName, isAfterEvent))
        return;
    const tracker = new EventTracker(eventName, isAfterEvent);
    tracker.start();
    trackers[isAfterEvent ? 'after' : 'before'][eventName] = tracker;
    const eventFullName = eventName + (isAfterEvent ? 'After' : 'Before') + 'Event';
    source.sendMessage({ translate: 'commands.trackevent.start', with: [eventFullName] });
}

function isValidEvent(source, eventName, isAfterEvent) {
    if ((isAfterEvent && !world.afterEvents[eventName]) || (!isAfterEvent && !world.beforeEvents[eventName])) {
        source.sendMessage({ translate: 'commands.trackevent.invalid', with: [eventName,isAfterEvent ? 'afterEvents' : 'beforeEvents'] });
        return false;
    }
    return true;
}

function getAllTrackerInfo() {
    return Object.values(trackers.before).map(tracker => tracker.getInfo()).concat(Object.values(trackers.after).map(tracker => tracker.getInfo()));
}

function getAllTrackerInfoString() {
    return Object.values(trackers.before).map(tracker => tracker.getInfoString()).concat(Object.values(trackers.after).map(tracker => tracker.getInfoString()));
}

export { getAllTrackerInfo, getAllTrackerInfoString };