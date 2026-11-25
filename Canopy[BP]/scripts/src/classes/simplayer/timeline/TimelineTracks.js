import { REPEATABLE_ACTIONS } from "../RepeatableAction";

function actionTrack(action) {
    return Object.freeze({ id: action, action, labelKey: `simplayer.action.${action}` });
}

export const TIMELINE_TRACKS = Object.freeze([
    actionTrack(REPEATABLE_ACTIONS.ATTACK),
    actionTrack(REPEATABLE_ACTIONS.INTERACT),
    Object.freeze({ id: 'use', action: REPEATABLE_ACTIONS.USE, labelKey: 'simplayer.timeline.track.use' }),
    Object.freeze({ id: 'usehold', hold: true, labelKey: 'simplayer.timeline.track.usehold' }),
    actionTrack(REPEATABLE_ACTIONS.BUILD),
    actionTrack(REPEATABLE_ACTIONS.BREAK),
    actionTrack(REPEATABLE_ACTIONS.DROP),
    actionTrack(REPEATABLE_ACTIONS.DROP_STACK),
    actionTrack(REPEATABLE_ACTIONS.DROP_ALL),
    actionTrack(REPEATABLE_ACTIONS.JUMP)
]);
