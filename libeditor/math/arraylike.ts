export type TypedArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array;
export type TypedArrayConstructor = { new (length: number): TypedArray };
export type NumberArray = number[] | TypedArray;
export type NumberArrayConstructor = { new (length: number): NumberArray };
export type BigTypedArray = BigInt64Array | BigUint64Array;
export type BigTypedArrayConstructor = { new (length: number): BigTypedArray };
export type BigNumberArray = bigint[] | BigTypedArray;
export type BigNumberArrayConstructor = { new (length: number): BigNumberArray };
