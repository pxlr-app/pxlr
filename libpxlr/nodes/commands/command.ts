import { assertAutoId, AutoId } from "../../autoid.ts";

export abstract class Command {
	public constructor(
		public targetHash: AutoId,
	) {
		targetHash && assertAutoId(targetHash);
	}
}
