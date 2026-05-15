export class QuickActionNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "QuickActionNotFoundError";
	}
}

export class QuickActionUnsupportedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "QuickActionUnsupportedError";
	}
}
