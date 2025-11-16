import { EntityComponentTypes } from "@minecraft/server";
import { EntityLifetimeRecord } from "./EntityLifetimeRecord";

export class ItemLifetimeRecord extends EntityLifetimeRecord {
    entityType;
    localizationKey;

    constructor(itemEntity, spawnReason) {
        super(itemEntity, spawnReason);
        const itemStack = itemEntity.getComponent(EntityComponentTypes.Item).itemStack;
        this.entityType = itemEntity.typeId + '-' + itemStack.typeId;
        this.localizationKey = { rawtext: [{ translate: itemEntity.localizationKey }, { text: ' §7(§f' }, { translate: itemStack.localizationKey }, { text: '§7)§f' }, ] };
    }
}