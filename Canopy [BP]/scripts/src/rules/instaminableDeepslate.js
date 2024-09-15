import { Rule } from 'lib/canopy/Canopy';
import Instaminable from 'src/classes/Instaminable';

const instamineableDeepslateRule = new Rule({
    category: 'Rules',
    identifier: 'instaminableDeepslate',
    description: 'Makes deepslate instaminable. Use netherite and haste 2.'
});

function isDeepslate(value) {
    return value.includes('deepslate')
}

new Instaminable(isDeepslate, instamineableDeepslateRule.getID());
