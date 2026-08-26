import { handleRequest, reconcileExpiredControls, type WorkerEnv } from "./worker";

export default {
	fetch(request: Request, env: WorkerEnv) {
		return handleRequest(request, env);
	},
	scheduled(_controller: unknown, env: WorkerEnv) {
		return reconcileExpiredControls(env);
	},
};
