import { Rule } from 'lib/canopy/Canopy';
import Instaminable from 'src/classes/Instaminable';

const instamineableDeepslateRule = new Rule({
    category: 'Rules',
    identifier: 'instaminableDeepslate',
    description: { translate: 'rules.instaminableDeepslate' }
});

function isDeepslate(value) {
    return value.includes('deepslate')
}

new Instaminable(isDeepslate, instamineableDeepslateRule.getID());
