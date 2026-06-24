import { Rule } from '../../lib/canopy/Rule.js';

export const noSimplayerSaving = new Rule({
    category: 'Rules',
    identifier: 'noSimplayerSaving',
    description: { text: 'Disables saving/loading of simulated player data.' }
});
