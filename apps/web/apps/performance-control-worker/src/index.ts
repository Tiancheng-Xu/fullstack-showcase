import { handleRequest, type WorkerEnv } from "./worker";

export default {
	fetch(request: Request, env: WorkerEnv) {
		return handleRequest(request, env);
	},
};
