import { BooleanRule } from 'lib/canopy/Canopy';
import Instaminable from 'src/classes/Instaminable';

const instamineableEndstoneRule = new BooleanRule({
    category: 'Rules',
    identifier: 'instaminableEndstone',
    description: { translate: 'rules.instaminableEndstone' }
});

function isEndStone(value) {
    return value.includes('end_stone');
}

new Instaminable(isEndStone, instamineableEndstoneRule.getID());
