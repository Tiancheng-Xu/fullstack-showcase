import {
	handleRequest,
	reconcileExpiredControls,
	refreshRegisteredDispatchReadiness,
	type WorkerEnv,
} from "./worker";

export default {
	fetch(request: Request, env: WorkerEnv) {
		return handleRequest(request, env);
	},
	scheduled(_controller: unknown, env: WorkerEnv) {
		return Promise.all([
			reconcileExpiredControls(env),
			refreshRegisteredDispatchReadiness(env),
		]).then(() => undefined);
	},
};
