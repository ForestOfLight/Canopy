import { EntityComponentTypes } from "@minecraft/server";
import { EntityLifetimeRecord } from "./EntityLifetimeRecord";

export class ItemLifetimeRecord extends EntityLifetimeRecord {
    entityType;
    localizationKey;

    constructor(itemEntity, spawnReason, spawnPriority = 0) {
        super(itemEntity, spawnReason, spawnPriority);
        const itemStack = itemEntity.getComponent(EntityComponentTypes.Item).itemStack;
        this.entityType = itemEntity.typeId + '-' + itemStack.typeId;
        this.localizationKey = { rawtext: [{ translate: itemEntity.localizationKey }, { text: ' §7(§f' }, { translate: itemStack.localizationKey }, { text: '§7)§f' }, ] };
    }
}