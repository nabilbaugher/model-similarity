# Model Fingerprinting - Detecting Training Lineage Through Style

The goal is to detect whether smaller/open-source models have been distilled from proprietary models (particularly Claude) by identifying distinctive stylistic fingerprints that survive the distillation process.

## Why does this matter?

- **Training contamination is hard to prove** - we need objective, systematic evidence
- **Stylistic tells are the smoking gun** - facts converge, but arbitrary taste decisions (verbal tics, code aesthetics) reveal lineage
- **It's actionable** - if we can fingerprint models, we can identify unauthorized distillation at scale
- This gets at a real problem Anthropic and others face with their models being used as training data

## Tech stack

Analysis: python/pandas/numpy/sklearn/matplotlib
Embeddings: OpenAI API (text-embedding-3-large) for quick validation
Models to test: Anthropic API, OpenAI API, various open-source models via their APIs
Data storage: JSON files initially (keep it simple), PostgreSQL if we need to scale

## How you should operate as my teammate working on this project

- **Lean startup methodology always** - validate assumptions before building, cheapest test first
- When I propose something complex (like an autoencoder), challenge me to validate with simpler approaches first
- Follow the assumption chain - if an early assumption fails, stop immediately rather than continuing
- Keep experiments small and fast - 30 minutes to 2 hours max per validation step
- Document findings as we go - what worked, what didn't, why
- Think like a researcher: what would falsify our hypothesis? What's the null hypothesis baseline?

## The ideal flow

- I say: "I think model X is distilled from Claude"
- You say: "What specific patterns make you think that? Let's start with 5 prompts that would show those patterns"
- I provide examples of the tells I've noticed
- You say: "Got it. Let's test those tells systematically. First, let's confirm Claude actually has those patterns consistently..."
- We generate responses, you show me the data
- You say: "Claude says 'You're absolutely right' in 7/10 responses. Model X says it in 8/10. GPT-5 says it 0/10. This is suspicious. Should we test more patterns or more prompts?"
- I decide next step based on results

In general, show me data frequently, ask for direction at decision points, and always question if we're about to build something complex when something simple would validate the same assumption.

## Technical approach (validate in sequence)

**Phase 1: Manual fingerprint extraction**

- Generate responses from known models (Claude, GPT-5, etc.) on 20 ambiguous prompts
- Manually identify distinctive patterns (verbal tics, code style, structure)
- Build fingerprint dictionary with pattern rarity weights

**Phase 2: Embedding-based validation**

- Embed all responses using existing embedding models (no training)
- Visualize with PCA/t-SNE
- Confirm models cluster by style in latent space

**Phase 3: Automated scoring**

- Score suspected models against fingerprint library
- Weight rare patterns higher (e.g., "You're absolutely right" is more distinctive than "however")
- Set threshold for "likely distilled" (>70% pattern match)

**Phase 4: Scale (only if validated)**

- If manual approach works, consider autoencoder for processing thousands of models
- But only after we've proven the concept with cheap methods

## V0 roadmap

[ ] Create 20 prompts with no objectively correct style (code, empathy, ambiguous questions, creative tasks)
[ ] Generate 3 responses per prompt from Claude Sonnet, GPT-5
[ ] Manual fingerprint extraction - build dictionary of Claude vs GPT patterns
[ ] Test assumption: can we reliably identify which model wrote a response blind?
[ ] Quick embedding validation - do models cluster in PCA space?
[ ] Generate responses from 2-3 suspected distilled models
[ ] Score suspected models against Claude fingerprint library
[ ] Decision: hypothesis supported or rejected?

## Success criteria

**Strong evidence of distillation:**

- Suspected model shows 3+ distinctive verbal tics per response
- Code aesthetic matches >70% of source model patterns
- Patterns correlate across multiple prompt types (not random)

**Evidence against distillation:**

- Patterns appear in random combinations
- New model has entirely novel tics
- Fingerprints inconsistent across prompts

## Key principle

Every step validates an assumption. Stop immediately when assumption fails. Never build complex infrastructure before validating with simple tests.
