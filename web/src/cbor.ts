// Copyright 2024 The Tari Project
// SPDX-License-Identifier: BSD-3-Clause

/* eslint-disable @typescript-eslint/no-explicit-any */

export type CborValue = { Map: Array<[any, any]> } |
    { Array: Array<any> } |
    { Tag: number } |
    { Bool: boolean } |
    { Bytes: Array<number> } |
    { Text: string } |
    { Float: number } |
    { Int: number } |
    { Null: null };

export function getValueByPath(cborRepr: CborValue | null, path: string): any {
    if (!cborRepr) {
        return null;
    }
    let value = cborRepr;
    for (const part of path.split(".")) {
        if (part == "$") {
            continue;
        }
        if ("Map" in value) {
            value = value.Map.find((v) => convertCborValue(v[0]) === part)?.[1];
            if (!value) {
                return null;
            }
            continue;
        }

        if ("Array" in value) {
            value = value.Array[parseInt(part)];
            continue;
        }

        return null;
    }
    return convertCborValue(value);
}

export function convertCborValue(value: any): any {
    if ("Map" in value) {
        const result = {} as { [key: string]: any };
        for (const [key, val] of value.Map) {
            result[convertCborValue(key) as string] = convertCborValue(val);
        }
        return result;
    }
    if ("Tag" in value) {
        return convertTaggedValueToString(value.Tag[0], value.Tag[1].Bytes);
    }
    if ("Text" in value) {
        return value.Text;
    }
    if ("Bytes" in value) {
        return value.Bytes;
    }

    if ("Array" in value) {
        return value.Array.map(convertCborValue);
    }
    if ("Integer" in value) {
        return value.Integer;
    }
    if ("Bool" in value) {
        return value.Bool;
    }
    return value;
}

function bytesToAddressString(type: string, tag: ArrayLike<number>): string {
    const hex = Array.from(tag, function (byte) {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");

    return `${type}_${hex}`;
}

export function convertTaggedValueToString(tag: number, value: any): string | any {
    switch (tag) {
        case BinaryTag.VaultId:
            return bytesToAddressString("vault", value);
        case BinaryTag.ComponentAddress:
            return bytesToAddressString("component", value);
        case BinaryTag.ResourceAddress:
            return bytesToAddressString("resource", value);
        default:
            return value;
    }
}

enum BinaryTag {
    ComponentAddress = 128,
    Metadata = 129,
    NonFungibleAddress = 130,
    ResourceAddress = 131,
    VaultId = 132,
    TransactionReceipt = 134,
    FeeClaim = 135,
}