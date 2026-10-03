import baai from "./content/conference/baai-2026-rl.md?raw";
import berkeley from "./content/conference/berkeley-agentic-ai-2026.md?raw";
import buildControl from "./content/conference/build-2026-agent-control.md?raw";
import buildHarness from "./content/conference/build-2026-harness.md?raw";
import buildWindowsMl from "./content/conference/build-2026-windows-ml.md?raw";
import googleIo from "./content/conference/google-io-2026.md?raw";
import nvidia from "./content/conference/nvidia-gtc-2026.md?raw";
import devday from "./content/conference/openai-devday-2026.md?raw";
import waic from "./content/conference/waic-2026.md?raw";
import yunqi from "./content/conference/yunqi-2026.md?raw";
import yunqiAgenticOs from "./content/conference/yunqi-2026-agentic-os.md?raw";

// These files are copied from the author's original notes without rewriting
// their substantive content. The renderer only deactivates vault-local links.
export const originalConferenceNotes: Record<string, string> = {
  "yunqi-2026": yunqi,
  "yunqi-2026-agentic-os": yunqiAgenticOs,
  "openai-devday-2026": devday,
  "berkeley-agentic-ai-2026": berkeley,
  "waic-2026": waic,
  "baai-2026-rl": baai,
  "build-2026-harness": buildHarness,
  "build-2026-agent-control": buildControl,
  "build-2026-windows-ml": buildWindowsMl,
  "google-io-2026": googleIo,
  "nvidia-gtc-2026": nvidia,
};
