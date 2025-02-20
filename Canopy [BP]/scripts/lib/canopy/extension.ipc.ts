import { PROTO } from '../ipc/ipc'

export const Ready = PROTO.Object({});

export const RegisterExtension = PROTO.Object({
    name: PROTO.String,
    version: PROTO.String,
    author: PROTO.String,
    description: PROTO.String,
    isEndstone: PROTO.Boolean
});

export const RegisterCommand = PROTO.Object({
    name: PROTO.String,
    description: PROTO.String,
    usage: PROTO.String,
    callback: PROTO.Optional(PROTO.Undefined),
    args: PROTO.Optional(PROTO.Array(PROTO.Object({}))),
    contingentRules: PROTO.Optional(PROTO.Array(PROTO.String)),
    adminOnly: PROTO.Optional(PROTO.Boolean),
    helpEntries: PROTO.Optional(PROTO.Array(PROTO.Object({}))),
    helpHidden: PROTO.Optional(PROTO.Boolean),
    extensionName: PROTO.Optional(PROTO.String),
});

export const RegisterRule = PROTO.Object({
    identifier: PROTO.String,
    description: PROTO.String,
    contingentRules: PROTO.Optional(PROTO.Array(PROTO.String)),
    independentRules: PROTO.Optional(PROTO.Array(PROTO.String)),
    extensionName: PROTO.Optional(PROTO.String),
});

export const RuleValueRequest = PROTO.Object({
    ruleID: PROTO.String,
});

export const RuleValueSet = PROTO.Object({
    ruleID: PROTO.String,
    value: PROTO.Boolean
});

export const CommandCallbackRequest = PROTO.Object({
    commandName: PROTO.String,
    senderName: PROTO.String,
    args: PROTO.Array(PROTO.String)
});

export const CommandPrefixRequest = PROTO.Object({
    prefix: PROTO.String
});