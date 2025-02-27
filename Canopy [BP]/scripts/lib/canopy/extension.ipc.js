/* eslint-disable new-cap */
import { PROTO } from '../ipc/ipc'

const description = PROTO.Object({
    text: PROTO.Optional(PROTO.String),
    translate: PROTO.Optional(PROTO.String),
    with: PROTO.Optional(PROTO.Array(PROTO.String))
});

export const Ready = PROTO.Void;

export const RegisterExtension = PROTO.Object({
    name: PROTO.String,
    version: PROTO.String,
    author: PROTO.String,
    description: description,
    isEndstone: PROTO.Boolean
});

export const RegisterCommand = PROTO.Object({
    name: PROTO.String,
    description: description,
    usage: PROTO.String,
    callback: PROTO.Optional(PROTO.Undefined),
    args: PROTO.Optional(PROTO.Array(PROTO.Object({
        type: PROTO.String,
        name: PROTO.String
    }))),
    contingentRules: PROTO.Optional(PROTO.Array(PROTO.String)),
    adminOnly: PROTO.Optional(PROTO.Boolean),
    helpEntries: PROTO.Optional(PROTO.Array(PROTO.Object({
        usage: PROTO.String,
        description: description
    }))),
    helpHidden: PROTO.Optional(PROTO.Boolean),
    extensionName: PROTO.Optional(PROTO.String)
});

export const RegisterRule = PROTO.Object({
    identifier: PROTO.String,
    description: description,
    contingentRules: PROTO.Optional(PROTO.Array(PROTO.String)),
    independentRules: PROTO.Optional(PROTO.Array(PROTO.String)),
    extensionName: PROTO.Optional(PROTO.String)
});

export const RuleValueRequest = PROTO.Object({
    ruleID: PROTO.String
});

export const RuleValueResponse = PROTO.Object({
    value: PROTO.Boolean
});

export const RuleValueSet = PROTO.Object({
    ruleID: PROTO.String,
    value: PROTO.Boolean
});

export const CommandCallbackRequest = PROTO.Object({
    commandName: PROTO.String,
    senderName: PROTO.Optional(PROTO.String),
    args: PROTO.String
});

export const CommandPrefixRequest = PROTO.Void;

export const CommandPrefixResponse = PROTO.Object({
    prefix: PROTO.String
});