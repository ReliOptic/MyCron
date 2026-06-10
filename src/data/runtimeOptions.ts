import type { RuntimeOption, RuntimeTarget } from "../types/mycron";

export const runtimeOptions: RuntimeOption[] = [
  {
    target: "hermes",
    label: "Hermes",
    actor: "host_agent:hermes",
    runtime: "Hermes Cloud",
    originAgent: "hermes",
    requiredCapabilities: ["network:read", "notify:send"],
  },
  {
    target: "github-actions",
    label: "GitHub",
    actor: "host_agent:github-actions",
    runtime: "GitHub Actions",
    originAgent: "github",
    requiredCapabilities: ["github:read", "artifact:write"],
  },
  {
    target: "local-runner",
    label: "Local",
    actor: "host_agent:local",
    runtime: "Local runner",
    originAgent: "local",
    requiredCapabilities: ["filesystem:read"],
  },
  {
    target: "k8s-cronjob",
    label: "K8s",
    actor: "host_agent:k8s-cronjob",
    runtime: "K8s CronJob",
    originAgent: "k8s",
    requiredCapabilities: ["network:read", "runtime:attest"],
  },
];

export function runtimeOptionFor(
  target: RuntimeTarget | "",
): RuntimeOption | null {
  return runtimeOptions.find((option) => option.target === target) ?? null;
}
