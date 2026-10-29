import { SynthesizedDocument } from '../types/video';

export const EXEMPLAR_VIDEOS: SynthesizedDocument[] = [
  {
    id: 'karpathy-state-of-gpt',
    meta: {
      title: 'State of GPT: Training Pipelines, RLHF, and LLM Mental Models',
      originalVideoUrl: 'https://www.youtube.com/watch?v=bZQun8Y4L2A',
      videoLengthMinutes: 105,
      readingTimeMinutes: 5,
      wordCountOriginal: 24800,
      wordCountSynthesized: 1350,
      compressionRatio: 95.2,
      zeroLossFidelityIndex: 99.7,
      speaker: 'Andrej Karpathy (ex-Director of AI at Tesla, OpenAI Co-Founder)',
      primaryDomain: 'Artificial Intelligence & Deep Learning',
      analyzedAt: '2026-10-24T18:30:00Z',
    },
    executiveBriefing: {
      oneSentenceCrux:
        'Large Language Models are not factual search engines or omniscient knowers—they are next-token stochastic pattern simulators whose cognitive performance depends critically on the four-stage training pipeline (Pretraining, SFT, Reward Modeling, and RLHF), tokenization idiosyncrasies, and prompt-conditioned working memory.',
      paradigmShift:
        'Pretraining consumes 99% of compute to produce a jagged, uncensored "dream simulator"; SFT and RLHF consume only 1% of compute but reshape the interface into a polite, aligned, and calibrated assistant at the expense of slight model entropy collapse.',
      highStakesTakeaway:
        'System 1 (fast next-token streaming) vs System 2 (tree-of-thought search, verification, and tool-augmented reasoning) is the fundamental missing bridge in raw LLMs. Never rely on an LLM to accurately perform byte/character counts or arithmetic without Python tools.',
      targetAudienceActionItem:
        'Architect AI systems that offload working memory to external context retrieval (RAG) and execution sandboxes, rather than attempting to fine-tune factual parametric memory.',
      keyMetricHighlights: [
        { label: 'Compute Allocation', value: '99% Pretraining', context: 'SFT & RLHF represent < 1% of training FLOPs' },
        { label: 'Token Efficiency', value: '3-4x compression', context: 'Byte-Pair Encoding vs raw ASCII bytes' },
        { label: 'RLHF Entropy Delta', value: '-14.2% perplexity divergence', context: 'Mode collapse traded for safety & consistency' },
        { label: 'Zero-Watch Index', value: '99.7% Fidelity', context: '0 of 18 technical caveats omitted' },
      ],
    },
    cognitiveArchitectureAudit: {
      discardedNoiseCategories: [
        { category: 'Speaker throat clears, greetings, setup banter', percentDiscarded: 98, reason: 'Zero pedagogical or technical value' },
        { category: 'Audience logistics and Q&A mic handoffs', percentDiscarded: 100, reason: 'Pure staging overhead' },
        { category: 'Repetitive restatements of basic definitions', percentDiscarded: 74, reason: 'Condensed into authoritative formalisms' },
      ],
      preservedKnowledgeVectors: [
        { category: 'Exact 4-Stage Training Pipeline Equations & Loss Formulations', count: 4, importanceRationale: 'Core operational blueprint required for real-world reproduction' },
        { category: 'Tokenizer Failure Modes (e.g. SolidGoldMagikarp, character reversal)', count: 3, importanceRationale: 'Explains silent production bugs in LLM applications' },
        { category: 'System 1 vs System 2 Cognitive Trade-off Matrix', count: 1, importanceRationale: 'Guiding architectural philosophy for agent engineering' },
      ],
      epistemicUncertaintyNotes: [
        'Karpathy notes that RLHF reward models can suffer from reward hacking if not constrained by KL-divergence penalties.',
        'Tokenizer artifacts cannot be fixed via standard prompt engineering without modifying the vocabulary dictionary.',
      ],
    },
    diagrams: [
      {
        id: 'diag-llm-pipeline',
        title: 'The 4-Stage Modern LLM Training Architecture',
        type: 'flowchart',
        caption: 'Sequential data and compute pipeline from raw web crawl to RLHF-aligned assistant model',
        explanation: 'Shows compute distribution, loss surfaces, and human supervision inflection points across the 4 stages.',
        nodes: [
          { id: 'n1', label: 'Raw Web Crawl (10T+ Tokens)', role: 'input', detail: 'Filtered CommonCrawl, GitHub, arXiv, Wikipedia', color: '#6366f1' },
          { id: 'n2', label: '1. Base Pretraining (99% Compute)', role: 'process', detail: 'Unsupervised next-token prediction, cross-entropy loss', color: '#3b82f6' },
          { id: 'n3', label: 'Base Model (Dream Simulator)', role: 'database', detail: 'Not an assistant; completes text statistically', color: '#8b5cf6' },
          { id: 'n4', label: '2. Supervised Fine-Tuning (SFT)', role: 'process', detail: '10K-100K high-quality human (Prompt, Response) pairs', color: '#10b981' },
          { id: 'n5', label: '3. Reward Modeling (RM)', role: 'decision', detail: 'Pairwise comparison ranking & Bradley-Terry loss', color: '#f59e0b' },
          { id: 'n6', label: '4. Reinforcement Learning (PPO/DPO)', role: 'process', detail: 'Optimize policy against reward model with KL penalty', color: '#06b6d4' },
          { id: 'n7', label: 'Aligned Production Assistant', role: 'output', detail: 'Calibrated, helpful, harmless, tool-equipped', color: '#22c55e' },
        ],
        edges: [
          { from: 'n1', to: 'n2', label: 'Tokenized by BPE' },
          { from: 'n2', to: 'n3', label: 'Hundreds of GPU days' },
          { from: 'n3', to: 'n4', label: 'Human instruction datasets' },
          { from: 'n4', to: 'n5', label: 'Human labelers rank candidates' },
          { from: 'n5', to: 'n6', label: 'Reward signal' },
          { from: 'n4', to: 'n6', label: 'Reference model baseline' },
          { from: 'n6', to: 'n7', label: 'Safety & helpfulness calibrated' },
        ],
      },
      {
        id: 'diag-system1-vs-2',
        title: 'Cognitive Execution: System 1 (Autoregressive) vs System 2 (Deliberation)',
        type: 'architecture',
        caption: 'Why standard LLMs fail at deep planning without external agentic loops',
        explanation: 'Compares constant-time per token sampling with tree-search verification loops.',
        nodes: [
          { id: 's1', label: 'User Query', role: 'input', detail: 'Prompt context' },
          { id: 's2', label: 'Greedy / Top-P Sampling', role: 'process', detail: 'Fixed O(1) FLOPs per token' },
          { id: 's3', label: 'Immediate Linear Output', role: 'output', detail: 'No backtracking, prone to hallucination' },
          { id: 's4', label: 'Tree of Thoughts / Monte Carlo', role: 'decision', detail: 'Explores multiple speculative candidate paths' },
          { id: 's5', label: 'Self-Reflection & Verifier Node', role: 'process', detail: 'Checks constraints against Python / Unit tests' },
          { id: 's6', label: 'Verified Robust Output', role: 'output', detail: '0% hallucination on deterministic constraints' },
        ],
        edges: [
          { from: 's1', to: 's2', label: 'System 1 (Raw LLM)' },
          { from: 's2', to: 's3' },
          { from: 's1', to: 's4', label: 'System 2 (Agentic Search)' },
          { from: 's4', to: 's5', label: 'Candidate branches' },
          { from: 's5', to: 's6', label: 'Verified optimal path' },
        ],
      },
    ],
    quantitativeGraphs: [
      {
        id: 'graph-compute-breakdown',
        title: 'Training FLOPs Distribution Across Stages',
        type: 'bar',
        xAxisLabel: 'Training Stage',
        yAxisLabel: 'Compute Share (%)',
        unit: '%',
        dataPoints: [
          { label: 'Pretraining', value: 99.2, annotation: 'Tens of thousands of H100 GPU hours' },
          { label: 'Supervised Fine-Tuning (SFT)', value: 0.5, annotation: 'Targeted instruction datasets' },
          { label: 'Reward Modeling', value: 0.15, annotation: 'Pairwise preferences' },
          { label: 'RLHF (PPO / DPO)', value: 0.15, annotation: 'Policy optimization' },
        ],
        insight: 'Over 99% of all computational cost resides in raw unsupervised next-token prediction; alignment is computationally negligible by comparison.',
        sourceTimestamp: '24:15',
      },
      {
        id: 'graph-loss-scaling',
        title: 'Chinchilla Optimal Scaling Laws: Parameters vs Dataset Tokens',
        type: 'line',
        xAxisLabel: 'Compute Budget (ZettaFLOPs)',
        yAxisLabel: 'Cross-Entropy Test Loss',
        unit: 'Nats',
        dataPoints: [
          { label: '10^21 FLOPs', value: 3.4, secondaryValue: 3.8, annotation: 'Under-trained baseline' },
          { label: '10^22 FLOPs', value: 2.7, secondaryValue: 3.1 },
          { label: '10^23 FLOPs', value: 2.1, secondaryValue: 2.5 },
          { label: '10^24 FLOPs', value: 1.6, secondaryValue: 1.9, annotation: 'Chinchilla optimal Frontier' },
        ],
        insight: 'Scaling compute requires balanced scaling of both parameter count and token volume; training smaller models on significantly more data yields superior inference efficiency.',
        sourceTimestamp: '38:40',
      },
    ],
    illustrationsAndMentalModels: [
      {
        id: 'ill-dream-simulator',
        title: 'The Dream Simulator Mental Model',
        concept: 'Base Models are Multi-Agent Fiction Simulators, Not Retrieval Engines',
        metaphor: 'A base model is an actor that can play a quantum physicist, a conspiracy theorist, or a Python compiler depending entirely on the prompt context disguise.',
        svgConceptType: 'neural_transformer',
        keyInsightQuote: 'Base models do not want to help you; they just want to complete documents. If you prompt them like a student asking a homework question, they might roleplay an incompetent student writing a wrong answer.',
        practicalApplication: 'Frame prompts with authoritative institutional preambles to condition the sampling distribution onto high-quality internet subsets.',
      },
      {
        id: 'ill-tokenizer-cliff',
        title: 'The Tokenizer Subword Blindspot',
        concept: 'LLMs see tokens (subword integer IDs), not individual characters or bytes',
        metaphor: 'Asking an LLM to count the letter "r" in "strawberry" is like asking a human to count how many individual pixels are in a thumbnail without zooming in.',
        svgConceptType: 'feedback_loop',
        keyInsightQuote: 'Tokens collapse 3 to 4 characters into a single atomic integer. The model has no internal recurrent hidden state over individual characters.',
        practicalApplication: 'Always wrap character manipulation, reverse strings, and arithmetic calculations inside sandbox execution tools.',
      },
    ],
    chronologicalChapters: [
      {
        id: 'c1',
        timestamp: '00:00 - 15:30',
        seconds: 0,
        title: 'Stage 1: Pretraining Dynamics & Data Recipe',
        importanceScore: 10,
        denseSummary: 'Pretraining compresses internet documents into statistical weights. The recipe relies on aggressive de-duplication, heuristic quality filtering, and subword BPE tokenization. The model minimizes cross-entropy loss over billions of parameters.',
        verbatimCriticalQuotes: [
          { quote: 'Pretraining is where the model acquires 99% of its raw knowledge, world model, and syntactic capability.', speaker: 'Karpathy', significance: 'Demystifies where intelligence actually originates' },
        ],
        technicalNuances: [
          'Vocab size typically 32,000 to 100,000 subwords.',
          'Context window length L scales attention computation quadratically O(L^2) without FlashAttention optimizations.',
        ],
      },
      {
        id: 'c2',
        timestamp: '15:31 - 38:15',
        seconds: 931,
        title: 'Stage 2: Supervised Fine-Tuning (SFT) & Conversational Inoculation',
        importanceScore: 9,
        denseSummary: 'Human contractor demonstrations teach the base model to respond as an assistant rather than just continuing document text. High-quality small datasets (10K curated prompts) beat 1M noisy web scraped conversations.',
        verbatimCriticalQuotes: [
          { quote: 'Quality is vastly more important than quantity in SFT. 1,000 perfect demonstrations outperform 100,000 noisy samples.', speaker: 'Karpathy', significance: 'Shift to data-centric alignment' },
        ],
        technicalNuances: [
          'Loss is masked so gradients only propagate through assistant tokens, ignoring prompt tokens.',
          'SFT models can hallucinate with high confidence because they learn the superficial cadence of authority.',
        ],
      },
      {
        id: 'c3',
        timestamp: '38:16 - 1:12:00',
        seconds: 2296,
        title: 'Stage 3 & 4: Reward Modeling and RLHF / DPO Optimization',
        importanceScore: 10,
        denseSummary: 'Because writing good text is harder than judging good text, reward models evaluate pairwise comparisons. PPO then nudges the generative model towards higher reward while penalizing drift via KL divergence from the original SFT policy.',
        verbatimCriticalQuotes: [
          { quote: 'Evaluating is easier than generating. That is the fundamental asymmetry that makes RLHF possible.', speaker: 'Karpathy', significance: 'Core mathematical foundation of RLHF' },
        ],
        technicalNuances: [
          'Objective: maximize E[R(x, y)] - beta * D_KL(pi_theta || pi_ref).',
          'Beta prevents reward hacking (e.g. generating unending sycophantic praise or excessive word counts).',
        ],
      },
      {
        id: 'c4',
        timestamp: '1:12:01 - 1:45:00',
        seconds: 4321,
        title: 'Operational Heuristics: Prompt Engineering as Cognitive Memory Management',
        importanceScore: 9,
        denseSummary: 'Prompt engineering is fundamentally memory bandwidth management. Models need scratchpads, chain-of-thought, and few-shot examples to distribute reasoning across token generation steps rather than solving complex math in a single forward pass.',
        verbatimCriticalQuotes: [
          { quote: 'LLMs cannot think between words. If you do not give them tokens to think, they cannot deliberate.', speaker: 'Karpathy', significance: 'Why Chain-of-Thought is physically necessary' },
        ],
        technicalNuances: [
          'Each generated token executes one full feed-forward pass of the transformer stack.',
          'Chain-of-thought expands reasoning depth from O(1) to O(N) compute per answer.',
        ],
      },
    ],
    forensicMasterMatrix: {
      coreTheoremsAndFormulas: [
        {
          name: 'RLHF Objective with KL-Divergence Constraint',
          formulaOrLaw: 'max_pi E[r(x,y)] - beta * D_KL(pi(y|x) || pi_ref(y|x))',
          implications: 'Ensures the policy generates preferred responses without drifting into ungrammatical reward-hacking artifacts.',
          timestamp: '52:10',
        },
        {
          name: 'Transformer Attention Time Complexity',
          formulaOrLaw: 'Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V  [O(N^2 * d)]',
          implications: 'Memory and compute scale quadratically with context length unless linear attention approximations are applied.',
          timestamp: '18:45',
        },
      ],
      tradeoffAnalysis: [
        {
          dimension: 'Model Size vs Context Window',
          optionA: 'Giant parameter model (e.g. 70B) with 8k context',
          optionB: 'Smaller dense model (e.g. 8B) with 128k context',
          winnerOrContext: 'Smaller model with large context wins for document RAG and latency; large model wins for complex multi-hop reasoning.',
        },
        {
          dimension: 'SFT vs RLHF',
          optionA: 'Pure SFT without RLHF',
          optionB: 'SFT followed by RLHF/DPO',
          winnerOrContext: 'RLHF drastically reduces hallucination on edge cases and produces better calibrated uncertainty calibration.',
        },
      ],
      zeroWatchChecklist: [
        { item: 'Base model vs Assistant distinction explained', verifiedIncluded: true, originalVideoTimestamp: '12:04', exactDetail: 'Base model is text predictor, not assistant' },
        { item: 'BPE tokenization integer mapping artifacts', verifiedIncluded: true, originalVideoTimestamp: '28:15', exactDetail: 'Subwords prevent character-level introspection' },
        { item: 'KL penalty formula and reward hacking risk', verifiedIncluded: true, originalVideoTimestamp: '54:30', exactDetail: 'beta * D_KL parameter bounds policy drift' },
        { item: 'Chain-of-thought compute scaling law', verifiedIncluded: true, originalVideoTimestamp: '1:18:20', exactDetail: 'Tokens as reasoning scratchpads' },
      ],
    },
    actionablePlaybook: [
      { step: 1, action: 'Offload Tokenizer-sensitive Tasks', implementationGuide: 'Use regex or Python execution tools for reverse string, count occurrences, or currency precision.', pitfallToAvoid: 'Never trust an LLM to do precise string indexing without tools.' },
      { step: 2, action: 'Incorporate Explicit Reasoning Scratchpads', implementationGuide: 'Instruct the model: "First, output your step-by-step logic between <thinking> tags before producing the final JSON."', pitfallToAvoid: 'Requesting direct answers immediately forces System 1 hallucinations.' },
      { step: 3, action: 'Calibrate Prompt Framing to High-Fidelity Archetypes', implementationGuide: 'Prefix instructions: "You are a Principal Staff Engineer conducting a rigorous peer review."', pitfallToAvoid: 'Using generic "You are helpful" prompts yields generic uncritical output.' },
    ],
    transcriptSegments: [
      { startSec: 0, endSec: 45, speaker: 'Andrej Karpathy', text: 'Welcome everyone. Today I want to give you the mental model for what is happening under the hood in modern generative AI and GPT models.', salience: 'medium' },
      { startSec: 46, endSec: 120, speaker: 'Andrej Karpathy', text: 'When people interact with ChatGPT, they often think it is a database or a search engine. That is fundamentally incorrect. The base model is an unsupervised next-token predictor trained on billions of web pages.', salience: 'high' },
      { startSec: 121, endSec: 210, speaker: 'Andrej Karpathy', text: 'The training pipeline consists of four major stages: Pretraining, Supervised Fine-Tuning, Reward Modeling, and Reinforcement Learning from Human Feedback. 99% of all compute is spent in stage one.', salience: 'high' },
    ],
  },
  {
    id: 'jensen-blackwell-keynote',
    meta: {
      title: 'NVIDIA Blackwell GPU Architecture & The Generative AI Infrastructure Era',
      originalVideoUrl: 'https://www.youtube.com/watch?v=Y2F8yisiS6E',
      videoLengthMinutes: 130,
      readingTimeMinutes: 6,
      wordCountOriginal: 31200,
      wordCountSynthesized: 1480,
      compressionRatio: 95.4,
      zeroLossFidelityIndex: 99.8,
      speaker: 'Jensen Huang (CEO & Founder, NVIDIA)',
      primaryDomain: 'Semiconductor Engineering & AI Supercomputing',
      analyzedAt: '2026-10-23T14:15:00Z',
    },
    executiveBriefing: {
      oneSentenceCrux:
        'The era of scaling AI solely through single-die microprocessors has ended; Blackwell redefines the fundamental computing unit from a chip into an entire liquid-cooled, optical-networked 72-GPU NVLink rack that delivers 30x faster inference and 25x lower energy consumption.',
      paradigmShift:
        'Rather than fighting physical reticle limits on silicon lithography, Blackwell binds two massive reticle-sized dies with a 10 TB/s bidirectional chip-to-chip interconnect that behaves as a single unified monolithic die to software.',
      highStakesTakeaway:
        'Second-generation Transformer Engine introduces 4-bit floating point (FP4) quantization without accuracy loss, doubling throughput and cutting memory bandwidth bottlenecks in half.',
      targetAudienceActionItem:
        'Datacenter operators and AI engineers must transition infrastructure planning from rack-and-server mentalities to unified liquid-cooled mega-switch topologies with NVLink spine backplanes.',
      keyMetricHighlights: [
        { label: 'Transistor Count', value: '208 Billion', context: 'Two dies unified over 10 TB/s NV-High Bandwidth Interface' },
        { label: 'Inference Speedup', value: '30x vs H100', context: 'Measured on 1.8T parameter mixture-of-experts models' },
        { label: 'Energy Reduction', value: '25x Efficiency', context: '4 Megawatts vs 100 Megawatts for equivalent token throughput' },
        { label: 'Zero-Watch Index', value: '99.8% Fidelity', context: 'All 24 hardware specs and NVLink topologies documented' },
      ],
    },
    cognitiveArchitectureAudit: {
      discardedNoiseCategories: [
        { category: 'Keynote stage applause, jokes, and pauses', percentDiscarded: 100, reason: 'Zero technical substance' },
        { category: 'Customer marketing video montages', percentDiscarded: 95, reason: 'Promotional filler without architectural data' },
        { category: 'Hardware chassis beauty shots repetition', percentDiscarded: 88, reason: 'Condensed into precise mechanical specs' },
      ],
      preservedKnowledgeVectors: [
        { category: 'NVLink 5.0 1.8 TB/s per GPU Switch Fabric Topology', count: 1, importanceRationale: 'Defines how 576 GPUs interconnect in a single all-to-all domain' },
        { category: 'FP4 Tensor Core Micro-Scaling Format (MXFP4)', count: 1, importanceRationale: 'Critical numerical precision standard for next-gen models' },
        { category: 'Direct-to-Chip Liquid Cooling 100kW Thermal Envelope', count: 1, importanceRationale: 'Datacenter mechanical constraint essential for deployments' },
      ],
      epistemicUncertaintyNotes: [
        'Real-world FP4 accuracy requires micro-scaling block exponent metadata to avoid gradient underflow.',
      ],
    },
    diagrams: [
      {
        id: 'diag-blackwell-rack',
        title: 'GB200 NVL72 Liquid-Cooled Architecture Topology',
        type: 'architecture',
        caption: 'The NVL72 rack acts as a single 130 TB/s memory domain with 72 GPUs and 36 Grace CPUs',
        explanation: 'Shows the copper spine backplane connecting 18 compute trays and 9 NVLink switch trays.',
        nodes: [
          { id: 'b1', label: '18 Compute Trays (72 Blackwell GPUs)', role: 'process', detail: '1.44 Exaflops FP4 inference capacity', color: '#10b981' },
          { id: 'b2', label: '36 Grace ARM Neoverse CPUs', role: 'database', detail: 'Coherent LPDDR5X memory bus', color: '#6366f1' },
          { id: 'b3', label: '9 NVLink Switch Trays', role: 'decision', detail: '5,184 copper differential cables', color: '#f59e0b' },
          { id: 'b4', label: 'Direct-to-Chip Liquid Cooling System', role: 'input', detail: '100 kW dissipation, 2L/sec coolant flow', color: '#06b6d4' },
          { id: 'b5', label: 'Unified 130 TB/s All-to-All Fabric', role: 'output', detail: 'Single GPU virtual address space across entire rack', color: '#22c55e' },
        ],
        edges: [
          { from: 'b1', to: 'b3', label: '1.8 TB/s bi-directional per GPU' },
          { from: 'b2', to: 'b1', label: '900 GB/s NVLink-C2C' },
          { from: 'b4', to: 'b1', label: 'Continuous thermal regulation' },
          { from: 'b3', to: 'b5', label: 'Zero-transceiver copper backplane' },
        ],
      },
    ],
    quantitativeGraphs: [
      {
        id: 'graph-inference-energy',
        title: 'Megawatts Required to Train & Run 1.8 Trillion Parameter MoE',
        type: 'comparison',
        xAxisLabel: 'Hardware Generation',
        yAxisLabel: 'Power Consumption (Megawatts)',
        unit: 'MW',
        dataPoints: [
          { label: 'Volta V100 (2018)', value: 120, annotation: 'Equivalent compute' },
          { label: 'Ampere A100 (2020)', value: 40 },
          { label: 'Hopper H100 (2022)', value: 10 },
          { label: 'Blackwell B200 (2024)', value: 1.2, annotation: '25x drop vs Hopper' },
        ],
        insight: 'Energy per generated token has fallen by nearly 100x over four semiconductor generations through architectural specialization.',
        sourceTimestamp: '42:10',
      },
    ],
    illustrationsAndMentalModels: [
      {
        id: 'ill-copper-backplane',
        title: 'Passive Copper vs Optical Transceivers',
        concept: 'Physics of Interconnect: Avoiding 20,000 Optical Transceivers',
        metaphor: 'Using direct zero-power copper traces inside the rack instead of converting electricity to photons and back saves 20 kilowatts of power purely in the wiring.',
        svgConceptType: 'hardware_bandwidth',
        keyInsightQuote: 'By designing the NVLink spine as a passive copper cartridge backplane, we save 20kW of rack power that can go straight into compute FLOPs.',
        practicalApplication: 'Rack-scale interconnect design should prioritize passive electromagnetic propagation before resorting to active optical optics.',
      },
    ],
    chronologicalChapters: [
      {
        id: 'bj1',
        timestamp: '00:00 - 25:00',
        seconds: 0,
        title: 'The Death of Moore Law & Rise of Datacenter Scale Computing',
        importanceScore: 8,
        denseSummary: 'Traditional CPU scaling is dead; general-purpose computing is collapsing under quadratic data expansion. Accelerated computing and generative AI represent the new foundation.',
        verbatimCriticalQuotes: [
          { quote: 'We are at the beginning of a new industrial revolution. Software is no longer written; software is manufactured in AI factories.', speaker: 'Jensen Huang', significance: 'Thesis of generative computing' },
        ],
        technicalNuances: ['Dennard scaling ceased around 2006; Amdahl law limits single-threaded speedup.'],
      },
      {
        id: 'bj2',
        timestamp: '25:01 - 58:00',
        seconds: 1501,
        title: 'Blackwell Silicon Architecture: Dual-Die 10 TB/s CoWoS-L Packaging',
        importanceScore: 10,
        denseSummary: '208 billion transistors manufactured on TSMC 4NP. Two dies joined by a 10 TB/s interface with micro-bump pitch that maintains cache coherency with zero software overhead.',
        verbatimCriticalQuotes: [
          { quote: 'To the programmer, Blackwell is not two chips. It is one monolithic GPU with zero cache latency penalty.', speaker: 'Jensen Huang', significance: 'Programming model transparency' },
        ],
        technicalNuances: ['192 GB HBM3e memory offering 8 TB/s bandwidth; 4-bit floating point tensor engines.'],
      },
    ],
    forensicMasterMatrix: {
      coreTheoremsAndFormulas: [
        {
          name: 'Micro-scaling Block FP4 Precision (MXFP4)',
          formulaOrLaw: 'Quant(X) = Scale_block * Int4(X / Scale_block)',
          implications: 'Preserves dynamic range across extreme gradient outliers while slashing memory bandwidth requirements by 50% vs FP8.',
          timestamp: '34:20',
        },
      ],
      tradeoffAnalysis: [
        {
          dimension: 'Copper Backplane vs Optical Cabling',
          optionA: 'Active Optical Transceivers (AOC)',
          optionB: 'Passive Copper Cartridge Spine',
          winnerOrContext: 'Copper wins inside the 72-GPU rack (saves 20kW, 0 failure rate); optics required only for inter-rack InfiniBand spines.',
        },
      ],
      zeroWatchChecklist: [
        { item: 'Dual die 10 TB/s interconnect documented', verifiedIncluded: true, originalVideoTimestamp: '29:45', exactDetail: 'Zero latency degradation across dies' },
        { item: 'FP4 micro-scaling format mechanism verified', verifiedIncluded: true, originalVideoTimestamp: '35:10', exactDetail: 'Maintains FP8 accuracy on LLMs' },
        { item: 'NVL72 thermal wattage and liquid flow rate', verifiedIncluded: true, originalVideoTimestamp: '51:10', exactDetail: '100 kW rack dissipation capacity' },
      ],
    },
    actionablePlaybook: [
      { step: 1, action: 'Audit Inference Engine Precision', implementationGuide: 'Evaluate TensorRT-LLM with FP4/FP8 quantization before budgeting next-generation GPU clusters.', pitfallToAvoid: 'Running standard FP16 consumes 4x unnecessary memory bandwidth.' },
      { step: 2, action: 'Plan Liquid Cooling Datacenter Retrofits', implementationGuide: 'Design CDUs (Coolant Distribution Units) for 45°C warm-water loops to eliminate costly chillers.', pitfallToAvoid: 'Air cooling cannot dissipate densities above 40kW per rack.' },
    ],
    transcriptSegments: [
      { startSec: 0, endSec: 60, speaker: 'Jensen Huang', text: 'Good morning everyone. Today we are introducing Blackwell, the engine of this new industrial revolution.', salience: 'medium' },
      { startSec: 61, endSec: 180, speaker: 'Jensen Huang', text: 'For thirty years we pushed silicon lithography. But today, the chip is no longer the computing unit. The datacenter rack is the computing unit.', salience: 'high' },
    ],
  },
];
