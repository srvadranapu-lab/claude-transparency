import { createFileRoute } from "@tanstack/react-router";
import ClaudeApp from "@/components/ClaudeApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Claude" },
      { name: "description", content: "Claude — Reasoning Transparency Layer prototype." },
    ],
  }),
  component: ClaudeApp,
});
