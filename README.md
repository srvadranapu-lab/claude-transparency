# Reasoning Transparency Layer — PM Fellowship Prototype

## What it is

A prototype exploring how AI can surface its reasoning inline, without interrupting the conversation. The Reasoning Transparency Layer is a feature concept built natively into a Claude-like chat interface, showing users exactly what assumptions were made, where confidence is low, and what they should verify before acting.

## The problem it solves

Users of AI tools often act on outputs without knowing:
- What assumptions the model made
- Where its confidence is genuinely low
- What they should verify before making a real-world decision

This layer surfaces that reasoning transparently, per answer, in a way that respects the flow of conversation.

## Key features

- **Inline reasoning panel per answer** — appears directly beneath Claude's response, not in a separate screen or sidebar
- **Signal depth preference** — users choose Beginner, Standard, or Advanced detail level before each answer
- **Four signal types** — Assumptions Made, Confidence Gap, Verify Before Acting, Fork Considered
- **Per-signal feedback** — thumbs-up / thumbs-down on each signal to improve relevance over time
- **Free tier gate UI** — honest messaging about what the free plan can and cannot guarantee

## How to run locally

```bash
git clone <repo-url>
cd <repo-folder>
npm install
npm run dev
```

## Live demo

https://claude-transparency.vercel.app/

## Built with

- React
- Tailwind CSS
- Vite
- Lovable

## Disclaimer

This is a PM fellowship prototype and **not a real Anthropic product**. Claude and the Claude interface are trademarks of Anthropic.
