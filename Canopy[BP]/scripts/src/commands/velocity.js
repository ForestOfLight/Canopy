import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
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
            optionalParameters: [
                { name: 'x', type: CustomCommandParamType.Float },
                { name: 'y', type: CustomCommandParamType.Float },
                { name: 'z', type: CustomCommandParamType.Float }
            ],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.velocityCommand(origin, ...args)
        });
    }

    velocityCommand(origin, victims, action, xVelocity, yVelocity, zVelocity) {
        const velocity = { x: xVelocity, y: yVelocity, z: zVelocity };
        if ([VELOCITY_ACTIONS.SET, VELOCITY_ACTIONS.ADD].includes(action) && (xVelocity === void 0 || yVelocity === void 0 || zVelocity === void 0))
            return { status: CustomCommandStatus.Failure, message: 'commands.velocity.missingvelocity' };
        switch (action) {
            case VELOCITY_ACTIONS.QUERY:
                return this.queryVelocity(origin, victims);
            case VELOCITY_ACTIONS.ADD:
                return this.addVelocity(origin, victims, velocity);
            case VELOCITY_ACTIONS.SET:
                return this.setVelocity(origin, victims, velocity);
            default:
                return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidaction' };
        }
    }

    queryVelocity(origin, victims) {
        for (const victim of victims) {
            if (!victim.isValid)
                continue;
            this.sendEntityVelocityMessage(origin, victim)
        }
        return { status: CustomCommandStatus.Success, message: 'commands.velocity.query' };
    }

    addVelocity(origin, victims, velocity) {
        for (const victim of victims) {
            if (!victim.isValid)
                continue;
            system.run(() => {
                victim.applyImpulse(velocity);
                this.sendEntityVelocityMessage(origin, victim);
            });
        }
        return { status: CustomCommandStatus.Success, message: 'commands.velocity.add' };
    }

    setVelocity(origin, victims, velocity) {
        for (const victim of victims) {
            if (!victim.isValid)
                continue;
            system.run(() => {
                victim.clearVelocity();
                victim.applyImpulse(velocity);
                this.sendEntityVelocityMessage(origin, victim);
            });
        }
        return { status: CustomCommandStatus.Success, message: 'commands.velocity.set' };
    }

    sendEntityVelocityMessage(origin, entity) {
        system.run(() => {
            const message = { rawtext: [
                { text: '§7' },
                { translate: entity.nameTag || entity.localizationKey },
                { text: `: ${Vector.from(entity.getVelocity())}` }
            ]};
            origin.sendMessage(message);
        });
    }
}

export const velocityCommand = new Velocity();