import { assertAutoId, AutoId } from "../../autoid.ts";

export abstract class Command {
	public constructor(
		public target: AutoId,
	) {
		target && assertAutoId(target);
	}
}
