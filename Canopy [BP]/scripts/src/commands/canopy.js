import { world } from '@minecraft/server'
import { module } from 'stickycore/dynamic'
import { Rule, Command } from 'lib/canopy/Canopy'
import Data from 'stickycore/data'
import { resetCounterMap } from 'src/commands/counter'

class RelatedRules {
    constructor() {
        this.dependancies = [
            { validRule: 'commandWarp', dependantRule: 'commandWarpSurvival' },
            { validRule: 'hotbarSwitching', dependantRule: 'hotbarSwitchingSurvival' },
            { validRule: 'instantTame', dependantRule: 'instantTameSurvival' },
        ];
        this.independancies = [
            { ruleOne: 'explosionChainReactionOnly', ruleTwo: 'explosionNoBlockDamage' },
        ]
    }
}

const cmd = new Command({
    name: 'canopy',
    description: 'Enable or disable a rule.',
    usage: 'canopy <rule> <true/false>',
    args: [
        { type: 'string', name: 'rule' },
        { type: 'boolean', name: 'enable' },
    ],
    callback: canopyCommand,
    adminOnly: true
})

function canopyCommand(sender, args) {
    const globalRules = module.exports['rules'];
    const { rule, enable } = args;
    if (rule === null || enable === null)
        return cmd.sendUsage(sender);

    const loweredRule = rule.toLowerCase();
    if (!isValidRule(loweredRule)) 
        return sender.sendMessage(`§cInvalid rule: ${rule}`);

    const isGlobal = true;
    const validRule = globalRules[loweredRule];

    if (enable === world.getDynamicProperty(validRule))
        return sender.sendMessage(`§7${rule} is already ${enable ? '§l§aenabled' : '§l§cdisabled'}§r§7.`);

    if (validRule === 'hopperCounters' && !enable)
        resetCounterMap();

    updateIndependantRules(sender, validRule, enable, isGlobal);
    updateDependantRules(sender, validRule, enable, isGlobal);
    
    Data.updateFeature(sender, validRule, enable, isGlobal);
}

function isValidRule(rule) {
    return module.exports['rules'][rule] !== undefined;
}

function updateIndependantRules(sender, rule, enable, isGlobal) {
    for (const rulePair of new RelatedRules().independancies) {
        if (rule === rulePair.ruleOne || rule === rulePair.ruleTwo) {
            let targetRule;
            if (rule === rulePair.ruleOne && enable && Rule.getValue(rulePair.ruleTwo)) {
                targetRule = rulePair.ruleTwo;
            } else if (rule === rulePair.ruleTwo && enable && Rule.getValue(rulePair.ruleOne)) {
                targetRule = rulePair.ruleOne;
            } else continue;

            enable = false;
            Data.updateFeature(sender, targetRule, enable, isGlobal);
        }
    }
}

function updateDependantRules(sender, Rule, enable, isGlobal) {
    for (const rulePair of new RelatedRules().dependancies) {
        let targetRule;
        if (enable && Rule === rulePair.dependantRule && !Rule.getValue(rulePair.validRule))
            targetRule = rulePair.validRule;
        else if (!enable && Rule === rulePair.validRule && Rule.getValue(rulePair.dependantRule))
            targetRule = rulePair.dependantRule;
        else continue;

        Data.updateFeature(sender, targetRule, enable, isGlobal);
    }
}