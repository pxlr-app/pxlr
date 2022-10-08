import { assertAutoId, AutoId } from "../autoid.ts";

export abstract class Command {
	public constructor(
		public readonly target: AutoId,
	) {
		assertAutoId(target);
	}
}
