import { BooleanRule } from 'lib/canopy/Canopy';
import Instaminable from 'src/classes/Instaminable';

const instamineableDeepslateRule = new BooleanRule({
    category: 'Rules',
    identifier: 'instaminableDeepslate',
    description: { translate: 'rules.instaminableDeepslate' }
});

function isDeepslate(value) {
    return value.includes('deepslate')
}

new Instaminable(isDeepslate, instamineableDeepslateRule.getID());
