import { BooleanRule } from 'lib/canopy/Canopy';
import Instaminable from 'src/classes/Instaminable';

const instamineableDeepslateRule = new BooleanRule({
    category: 'Rules',
    identifier: 'instaminableDeepslate',
    description: { translate: 'rules.instaminableDeepslate' },
    wikiDescription: 'Makes deepslate and its variants instaminable when using an efficiency 5 netherite pickaxe with haste 2.'
});

function isDeepslate(value) {
    return value.includes('deepslate')
}

new Instaminable(isDeepslate, instamineableDeepslateRule.getID());
