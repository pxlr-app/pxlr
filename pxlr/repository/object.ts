import { Blob } from "./blob.ts";
import { Commit } from "./commit.ts";
import { Tree } from "./tree.ts";

export type Object = Blob | Tree | Commit;

export type ObjectWithHash<T extends Object> = { hash: string } & T;
