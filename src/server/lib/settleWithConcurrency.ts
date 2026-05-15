export const settleWithConcurrency = async <Input, Output>(
	items: Input[],
	concurrency: number,
	task: (item: Input, index: number) => Promise<Output>,
) => {
	const results = new Array<PromiseSettledResult<Output>>(items.length);
	const workerCount = Math.min(
		Math.max(1, Math.floor(concurrency)),
		items.length,
	);
	let nextIndex = 0;

	if (items.length === 0) return results;

	await Promise.all(
		Array.from({ length: workerCount }, async () => {
			while (nextIndex < items.length) {
				const index = nextIndex;
				nextIndex += 1;

				try {
					results[index] = {
						status: "fulfilled",
						value: await task(items[index], index),
					};
				} catch (reason) {
					results[index] = {
						status: "rejected",
						reason,
					};
				}
			}
		}),
	);

	return results;
};
