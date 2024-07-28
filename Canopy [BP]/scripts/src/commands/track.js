import { world } from '@minecraft/server';
import EventTracker from 'src/classes/EventTracker';
import Command from 'stickycore/command';
import Utils from 'stickycore/utils';

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

new Command()
    .setName('trackevent')
    .addArgument('string', 'eventName')
    .addArgument('string', 'isAfterEvent')
    .setCallback(trackCommand)
    .build();

function trackCommand(sender, args) {
    let { eventName, isAfterEvent } = args;
    if (eventName === null)
        return sender.sendMessage('§cUsage: ./trackevent <eventName> [beforeEvent/afterEvent]');
    if (isAfterEvent == 'beforeEvent')
        isAfterEvent = false;
    else if (isAfterEvent == 'afterEvent' || isAfterEvent === null)
        isAfterEvent = true;
    else
        return sender.sendMessage('§cUsage: ./trackevent <eventName> [beforeEvent/afterEvent]');

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
    sender.sendMessage(`§7Stopped tracking ${eventName}${isAfterEvent ? 'After' : 'Before'}Event.`);
    Utils.broadcastActionBar(`§7${sender.name} stopped tracking ${eventName}${isAfterEvent ? 'After' : 'Before'}Event.`, sender);
}

function startTracking(sender, eventName, isAfterEvent) {
    if (!isValidEvent(sender, eventName, isAfterEvent))
        return;
    const tracker = new EventTracker(eventName, isAfterEvent);
    tracker.start();
    trackers[isAfterEvent ? 'after' : 'before'][eventName] = tracker;
    sender.sendMessage(`§7Tracking ${eventName}${isAfterEvent ? 'After' : 'Before'}Event.`);
    Utils.broadcastActionBar(`§7${sender.name} started tracking ${eventName}${isAfterEvent ? 'After' : 'Before'}Event.`, sender);
}

function isValidEvent(sender, eventName, isAfterEvent) {
    if ((isAfterEvent && !world.afterEvents[eventName]) || (!isAfterEvent && !world.beforeEvents[eventName])) {
        console.warn(eventName, isAfterEvent, world.afterEvents[eventName], world.beforeEvents[eventName]);
        sender.sendMessage(`§cEvent ${eventName} not found in ${isAfterEvent ? 'afterEvents' : 'beforeEvents'}.`);
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