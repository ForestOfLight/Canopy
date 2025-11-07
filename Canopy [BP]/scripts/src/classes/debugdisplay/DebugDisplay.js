import { system, world } from '@minecraft/server';
import { DebugDisplayTextDrawer } from './DebugDisplayTextDrawer';
import { DebugDisplayTextElement } from './DebugDisplayTextElement';
import { DebugDisplayShapeElement } from './DebugDisplayShapeElement';

import { Location } from './Location';
import { HeadLocation } from './HeadLocation';
import { Speed } from './Speed';
import { ID } from './ID';
import { Velocity } from './Velocity';
import { Rotation } from './Rotation';
import { IsClimbing } from './IsClimbing';
import { IsFalling } from './IsFalling';
import { IsInWater } from './IsInWater';
import { IsOnGround } from './IsOnGround';
import { IsSleeping } from './IsSleeping';
import { IsSneaking } from './IsSneaking';
import { IsSprinting } from './IsSprinting';
import { IsSwimming } from './IsSwimming';
import { IsValid } from './IsValid';
import { Effects } from './Effects';
import { NameTag } from './NameTag';
import { Target } from './Target';
import { TypeID } from './TypeID';
import { ViewDirection } from './ViewDirection';
import { Health } from './Health';
import { Age } from './Age';
import { GrowUp } from './GrowUp';
import { Breath } from './Breath';
import { Equipment } from './Equipment';
import { Exhaustion } from './Exhaustion';
import { FlySpeed } from './FlySpeed';
import { Friction } from './Friction';
import { Hunger } from './Hunger';
import { Container } from './Container';
import { IsIllagerCaptain } from './IsIllagerCaptain';
import { Item } from './Item';
import { LavaMovement } from './LavaMovement';
import { Leash } from './Leash';
import { Variant } from './Variant';
import { OnFire } from './OnFire';
import { Projectile } from './Projectile';
import { PushThrough } from './PushThrough';
import { Ride } from './Ride';
import { Riding } from './Riding';
import { Saturation } from './Saturation';
import { Scale } from './Scale';
import { SkinId } from './SkinId';
import { Tame } from './Tame';
import { Families } from './Families';
import { TNT } from './TNT';
import { CollisionBox } from './CollisionBox';
import { HitBox } from './HitBox';
import { EyeLevel } from './EyeLevel';
import { ViewDirectionVector } from './ViewDirectionVector';

const entityToDebugDisplayMap = {};
const debugableProperties = Object.freeze({
    age: Age,
    breath: Breath,
    container: Container,
    effects: Effects,
    equipment: Equipment,
    exhaustion: Exhaustion,
    flyspeed: FlySpeed,
    friction: Friction,
    growup: GrowUp,
    headlocation: HeadLocation,
    health: Health,
    hunger: Hunger,
    id: ID,
    isclimbing: IsClimbing,
    isfalling: IsFalling,
    isillagercaptain: IsIllagerCaptain,
    isinwater: IsInWater,
    isonground: IsOnGround,
    issleeping: IsSleeping,
    issneaking: IsSneaking,
    issprinting: IsSprinting,
    isswimming: IsSwimming,
    isvalid: IsValid,
    item: Item,
    lavamovement: LavaMovement,
    leash: Leash,
    location: Location,
    nametag: NameTag,
    onfire: OnFire,
    projectile: Projectile,
    pushthrough: PushThrough,
    ride: Ride,
    riding: Riding,
    rotation: Rotation,
    saturation: Saturation,
    scale: Scale,
    skinid: SkinId,
    speed: Speed,
    tame: Tame,
    target: Target,
    tnt: TNT,
    typeid: TypeID,
    families: Families,
    variant: Variant,
    velocity: Velocity,
    viewdirection: ViewDirection,

    collisionbox: CollisionBox,
    hitbox: HitBox,
    eyelevel: EyeLevel,
    viewdirectionvector: ViewDirectionVector
});

export class DebugDisplay {
	entity;
	enabledElements = [];
	debugMessage = '';
    textDrawer;

	constructor(entity) {
		this.entity = entity;
		entityToDebugDisplayMap[entity.id] = this;
        this.startDebugDisplay();
	}

    destroy() {
        this.textDrawer.destroy();
        this.textDrawer = void 0;
        this.enabledElements.forEach(element => {
            if (element instanceof DebugDisplayShapeElement)
                element.destroy();
        });
        delete entityToDebugDisplayMap[this.entity.id];
    }

    addElement(property) {
        if (DebugDisplay.isDebugableProperty(property) && !this.hasElement(property)) 
            this.enabledElements.push(new debugableProperties[property](this.entity));
    }

    removeElement(property) {
        const index = this.enabledElements.findIndex(e => e instanceof debugableProperties[property]);
        let splicedElement;
        if (index !== -1)
            splicedElement = this.enabledElements.splice(index, 1)[0];
        if (splicedElement instanceof DebugDisplayShapeElement)
            splicedElement.destroy();
    }

    hasElement(property) {
        return this.enabledElements.some(e => e instanceof debugableProperties[property]);
    }

	update() {
		this.debugMessage = '';
		const enabledElements = this.getEnabledElements();
		for (let i = 0; i < enabledElements.length; i++) {
            const element = enabledElements[i];
            if (element instanceof DebugDisplayTextElement)
                this.updateTextElementData(element, i);
            else
                element.update();
        }
		this.debugMessage.trim();
        this.textDrawer.update();
	}
	
	updateTextElementData(element, currIndex) {
		let elementText = element.getFormattedData();
        if (elementText === void 0 ||this.isWhitespace(elementText))
            elementText = element.type + ': §7n/a';
        else
            elementText = element.type + ': ' + elementText;
		if (currIndex !== 0 && !this.isWhitespace(elementText))
			this.debugMessage += '\n§r';
		this.debugMessage += elementText;
	}

	getEnabledElements() {
		return this.enabledElements;
	}

	isWhitespace(str) {
		return /^\s*$/.test(str);
	}

	startDebugDisplay() {
        if (!this.textDrawer)
            this.textDrawer = new DebugDisplayTextDrawer(this);
	}

    static getDebugDisplay(entity) {
        return entityToDebugDisplayMap[entity.id];
    }

    static getDebugableProperties() {
        return Object.keys(debugableProperties);
    }

    static isDebugableProperty(property) {
        return Object.keys(debugableProperties).includes(property);
    }

    static onTick() {
        for (const entityId in entityToDebugDisplayMap) {
            const debugDisplay = entityToDebugDisplayMap[entityId];
            if (!debugDisplay)
                continue;
            debugDisplay.update();
        }
    }

    static onEntityRemove(event) {
        const entity = event.removedEntity;
        if (!entity || !entityToDebugDisplayMap[entity.id])
            return;
        entityToDebugDisplayMap[entity.id].destroy();
    }

    static onShutdown() {
        for (const entityId in entityToDebugDisplayMap) {
            const debugDisplay = entityToDebugDisplayMap[entityId];
            if (!debugDisplay)
                continue;
            debugDisplay.destroy();
        }
    }
}

system.runInterval(DebugDisplay.onTick);
world.beforeEvents.entityRemove.subscribe(DebugDisplay.onEntityRemove);
system.beforeEvents.shutdown.subscribe(DebugDisplay.onShutdown);
