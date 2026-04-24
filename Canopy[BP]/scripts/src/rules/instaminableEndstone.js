import { BooleanRule } from 'lib/canopy/Canopy';
import Instaminable from 'src/classes/Instaminable';

const instamineableEndstoneRule = new BooleanRule({
    category: 'Rules',
    identifier: 'instaminableEndstone',
    description: { translate: 'rules.instaminableEndstone' },
    wikiDescription: 'Makes endstone and its variants instaminable when using an efficiency 5 netherite pickaxe with haste 2.'
});

function isEndStone(value) {
    return value.includes('end_stone');
}

new Instaminable(isEndStone, instamineableEndstoneRule.getID());
