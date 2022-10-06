export interface Node {
	readonly id: string;
	readonly name: string;
	serializeToObject(): Object;
}
