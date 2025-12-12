import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../lib/canopy/Canopy";
import { Vector } from "../../lib/Vector.js";

const VELOCITY_ACTIONS = Object.freeze({
    QUERY: 'query',
    ADD: 'add',
    SET: 'set'
});

export class Velocity extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:velocity',
            description: 'commands.velocity',
            enums: [{ name: 'canopy:velocityAction', values: Object.values(VELOCITY_ACTIONS) }],
            mandatoryParameters: [
                { name: 'victim', type: CustomCommandParamType.EntitySelector },
                { name: 'canopy:velocityAction', type: CustomCommandParamType.Enum }
            ],
            optionalParameters: [ { name: 'velocity', type: CustomCommandParamType.Location } ],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.velocityCommand(origin, ...args)
        });
    }

    velocityCommand(origin, victims, action, velocity) {
        if (action === VELOCITY_ACTIONS.SET && !velocity)
            return { status: CustomCommandStatus.Failure, message: 'commands.velocity.missingvelocity' };
        switch (action) {
            case VELOCITY_ACTIONS.QUERY:
                return this.queryVelocity(victims);
            case VELOCITY_ACTIONS.ADD:
                return this.addVelocity(victims, velocity);
            case VELOCITY_ACTIONS.SET:
                return this.setVelocity(victims, velocity);
            default:
                return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidaction' };
        }
    }

    queryVelocity(victims) {
        const message = { rawtext: [
            { translate: 'commands.velocity.query.header' }
        ]};
        for (const victim of victims) {
            if (!victim.isValid)
                continue;
            message.rawtext.push({ rawtext: [
                { text: ', '},
                { translate: victim.localizationKey },
                { text: `: ${Vector.from(victim.getVelocity())}` }
            ]});
        }
        return message;
    }

    addVelocity(victims, velocity) {
        const message = { rawtext: [
            { translate: 'commands.velocity.add.header' }
        ]};
        for (const victim of victims) {
            if (!victim.isValid)
                continue;
            victim.applyImpulse(velocity);
            message.rawtext.push({ rawtext: [
                { text: ', '},
                { translate: victim.localizationKey }
            ]});
        }
        return message;
    }

    setVelocity(victims, velocity) {
        const message = { rawtext: [
            { translate: 'commands.velocity.set.header' }
        ]};
        for (const victim of victims) {
            if (!victim.isValid)
                continue;
            victim.clearVelocity();
            victim.applyImpulse(velocity);
            message.rawtext.push({ rawtext: [
                { text: ', '},
                { translate: victim.localizationKey }
            ]});
        }
        return message;
    }
}

export const velocityCommand = new Velocity();