import { world } from '@minecraft/server';
import { Command } from 'lib/canopy/Canopy';
import EventTracker from 'src/classes/EventTracker';
import Utils from 'include/utils';

const cmd = new Command({
    name: 'trackevent',
    description: { translate: 'commands.trackevent' },
    usage: 'trackevent <eventName> [beforeEvent/afterEvent]',
    args: [
        { type: 'string', name: 'eventName' },
        { type: 'string', name: 'eventType' }
    ],
    callback: trackCommand
});

const trackers = {
    before: {},
    after: {}
};

world.afterEvents.worldInitialize.subscribe(() => {
    const trackedEventsJSON = world.getDynamicProperty('trackedEvents')
    const trackedEvents = trackedEventsJSON ? JSON.parse(trackedEventsJSON) : [];
    for (const savedTracker of trackedEvents) {
        const tracker = new EventTracker(savedTracker.eventName, savedTracker.isAfterEvent, savedTracker.count);
        tracker.start();
        tracker.setCount(savedTracker.count);
        trackers[savedTracker.isAfterEvent ? 'after' : 'before'][savedTracker.eventName] = tracker;
    }
});

function trackCommand(sender, args) {
    const { eventName, eventType } = args;
    let isAfterEvent;
    if (eventName === null)
        return cmd.sendUsage(sender);
    if (eventType === 'beforeEvent')
        isAfterEvent = false;
    else if (eventType === 'afterEvent' || eventType === null)
        isAfterEvent = true;
    else
        return cmd.sendUsage(sender);

    if (alreadyTracking(eventName, isAfterEvent))
        stopTracking(sender, eventName, isAfterEvent);
    else
        startTracking(sender, eventName, isAfterEvent);
}

function alreadyTracking(eventName, isAfterEvent) {
    return (isAfterEvent && trackers.after[eventName]) || (!isAfterEvent && trackers.before[eventName]);
}

function stopTracking(sender, eventName, isAfterEvent) {
    if (!isValidEvent(sender, eventName, isAfterEvent))
        return;
    const tracker = new EventTracker(eventName, isAfterEvent);
    tracker.stop();
    delete trackers[isAfterEvent ? 'after' : 'before'][eventName];
    const eventFullName = eventName + (isAfterEvent ? 'After' : 'Before') + 'Event';
    sender.sendMessage({ translate: 'commands.trackevent.stop', with: [eventFullName] });
    Utils.broadcastActionBar({ rawtext: [{ text: `[${sender.name}] `},{ translate: 'commands.trackevent.stop', with: [eventFullName] }] });
}

function startTracking(sender, eventName, isAfterEvent) {
    if (!isValidEvent(sender, eventName, isAfterEvent))
        return;
    const tracker = new EventTracker(eventName, isAfterEvent);
    tracker.start();
    trackers[isAfterEvent ? 'after' : 'before'][eventName] = tracker;
    const eventFullName = eventName + (isAfterEvent ? 'After' : 'Before') + 'Event';
    sender.sendMessage({ translate: 'commands.trackevent.start', with: [eventFullName] });
    Utils.broadcastActionBar({ rawtext: [{ text: `[${sender.name}] `},{ translate: 'commands.trackevent.start', with: [eventFullName] }] });
}

function isValidEvent(sender, eventName, isAfterEvent) {
    if ((isAfterEvent && !world.afterEvents[eventName]) || (!isAfterEvent && !world.beforeEvents[eventName])) {
        sender.sendMessage({ translate: 'commands.trackevent.invalid', with: [eventName,isAfterEvent ? 'afterEvents' : 'beforeEvents'] });
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