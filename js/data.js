// Core Category Taxonomy & Configuration
const CATEGORIES = [
  "All Stories",
  "Engineering",
  "Design & UX",
  "AI & Futures",
  "Culture",
  "Founder Notes",
  "Productivity"
];

const FEATURED_TOPICS = [
  "Architecture",
  "DistributedSystems",
  "Design",
  "MicroInteractions",
  "AI",
  "NeuralNetworks",
  "DeepWork",
  "Startups",
  "Markdown",
  "Productivity"
];

const TOP_AUTHORS = [
  {
    name: "Sarah Jenkins",
    role: "Principal Systems Architect",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    bio: "Obsessed with distributed consensus, high-throughput pipelines, and system reliability."
  },
  {
    name: "Marcus Chen",
    role: "Design Director & UI Lead",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    bio: "Exploring tactile interfaces, organic micro-physics, and thoughtful design systems."
  },
  {
    name: "Aria Vance",
    role: "AI Researcher & Futurist",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    bio: "Investigating associative memory, neuro-symbolic reasoning, and human-AI collaboration."
  }
];

const INITIAL_ARTICLES = [
  {
    id: "a0000001-0000-4000-8000-000000000001",
    title: "Architecting High-Throughput Event Streams with Zero Data Loss",
    slug: "architecting-high-throughput-event-streams-with-zero-data-loss",
    excerpt: "A field guide to partitioning, backpressure strategies, and distributed consensus in mission-critical real-time streaming architectures.",
    content: "<p class=\"lead\">A field guide to partitioning, backpressure strategies, and distributed consensus in mission-critical real-time streaming architectures.</p><h2>The Anatomy of Modern Stream Processing</h2><p>When operating systems that ingest hundreds of thousands of events per second, traditional database write patterns break down under disk I/O constraints. Embracing log-structured storage engines and partition-aware consumers allows teams to decouple ingestion bursts from downstream business processing.</p><blockquote>\"Reliability in distributed streaming is not about preventing component failure; it is about guaranteeing deterministic replayability when failure inevitably strikes.\"</blockquote><h3>Key Architectural Patterns</h3><ul><li><strong>Idempotent Event Producers:</strong> Ensure retries do not introduce duplicate mutations into ledger tables.</li><li><strong>Dynamic Backpressure:</strong> Allow consumer lag signals to throttle ingest workers before memory limits trigger process termination.</li><li><strong>Dead-Letter Circuit Breakers:</strong> Route malformed payloads to quarantine queues for human inspection without stalling the main pipeline.</li></ul>",
    category: "Engineering",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    tags: ["Engineering", "Architecture", "DistributedSystems", "Streaming"],
    readingTime: 6,
    publishedAt: "Nov 1, 2026",
    authorId: "11111111-1111-4111-8111-111111111111",
    author: {
      name: "Sarah Jenkins",
      role: "Principal Systems Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
    },
    likes: 142,
    claps: 142,
    featured: true,
    trending: true,
    comments: []
  },
  {
    id: "a0000002-0000-4000-8000-000000000002",
    title: "Designing Beyond Flat Surfaces: The Evolution of Spatial Micro-Interactions",
    slug: "designing-beyond-flat-surfaces-the-evolution-of-spatial-micro-interactions",
    excerpt: "How subtle elevation cues, tactile haptics, and physics-driven spring animations elevate digital interactions from sterile to human.",
    content: "<p class=\"lead\">How subtle elevation cues, tactile haptics, and physics-driven spring animations elevate digital interactions from sterile to human.</p><h2>The Fall of Rigid Flatness</h2><p>Over the last decade, digital design swung aggressively toward ultra-flat interfaces. While clean, this minimalism often stripped away spatial affordances that humans intuitively rely on. Modern design systems are rediscovering depth through dynamic lighting, organic physics, and context-aware feedback.</p><blockquote>\"Great micro-interactions do not shout for attention; they whisper confirmation and provide reassurance at the exact millisecond of intent.\"</blockquote><h3>Designing with Physical Coherence</h3><p>When an element expands on touch, applying spring damping curves instead of linear ease curves makes the interface feel tangible. Pairing these visual cues with micro-vibrations transforms everyday smartphone actions into tactile delight.</p>",
    category: "Design & UX",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
    tags: ["Design", "UX", "MicroInteractions", "Animation"],
    readingTime: 4,
    publishedAt: "Nov 3, 2026",
    authorId: "22222222-2222-4222-8222-222222222222",
    author: {
      name: "Marcus Chen",
      role: "Design Director & UI Lead",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
    },
    likes: 98,
    claps: 98,
    featured: false,
    trending: true,
    comments: []
  },
  {
    id: "a0000003-0000-4000-8000-000000000003",
    title: "Beyond Attention Windows: Memory Networks and Autonomous Reasoning",
    slug: "beyond-attention-windows-memory-networks-and-autonomous-reasoning",
    excerpt: "Exploring next-generation architectures that combine continuous associative memory with neuro-symbolic verification.",
    content: "<p class=\"lead\">Exploring next-generation architectures that combine continuous associative memory with neuro-symbolic verification.</p><h2>The Limit of Quadratic Context</h2><p>While multi-million token context windows represent an astonishing engineering milestone, brute-forcing attention maps across massive token sequences is thermodynamically expensive and semantically noisy. Real autonomous intelligence requires episodic retention and active working memory.</p><blockquote>\"True agency is not the ability to read 10 books in one second; it is the capacity to remember the right paragraph when making a critical decision three weeks later.\"</blockquote><h3>Associative Memory Grids</h3><p>By blending vector embedding lookups with graph-based ontological traversals, models can verify their own deductions against grounded facts before producing final tokens.</p>",
    category: "AI & Futures",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    tags: ["AI", "MachineLearning", "NeuralNetworks", "Futures"],
    readingTime: 8,
    publishedAt: "Nov 5, 2026",
    authorId: "33333333-3333-4333-8333-333333333333",
    author: {
      name: "Aria Vance",
      role: "AI Researcher & Futurist",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80"
    },
    likes: 215,
    claps: 215,
    featured: true,
    trending: true,
    comments: []
  },
  {
    id: "a0000004-0000-4000-8000-000000000004",
    title: "The Quiet Revolution of Deep Work in an Always-On Asynchronous World",
    slug: "the-quiet-revolution-of-deep-work-in-an-always-on-asynchronous-world",
    excerpt: "Why knowledge teams are abandoning instant ping culture in favor of structured focus blocks and high-signal memos.",
    content: "<p class=\"lead\">Why knowledge teams are abandoning instant ping culture in favor of structured focus blocks and high-signal memos.</p><h2>The Hidden Cost of Constant Availability</h2><p>When team members expect responses within 5 minutes, nobody can afford to immerse themselves in complex problem spaces. Context switching burns executive energy faster than difficult code or challenging design problems.</p><blockquote>\"A four-hour uninterrupted block produces more breakthroughs than forty fragmented fifteen-minute intervals scattered across a week.\"</blockquote><h3>Cultivating High-Signal Documentation</h3><p>Shifting from rapid messaging threads to thoughtfully written memos creates institutional memory, respects cognitive boundaries, and levels the playing field for global distributed contributors.</p>",
    category: "Culture",
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    tags: ["Culture", "DeepWork", "Productivity", "Mindset"],
    readingTime: 5,
    publishedAt: "Nov 7, 2026",
    authorId: "11111111-1111-4111-8111-111111111111",
    author: {
      name: "Sarah Jenkins",
      role: "Principal Systems Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
    },
    likes: 120,
    claps: 120,
    featured: false,
    trending: true,
    comments: []
  },
  {
    id: "a0000005-0000-4000-8000-000000000005",
    title: "Bootstrapping to Product-Market Fit Without Sacrificing Craft",
    slug: "bootstrapping-to-product-market-fit-without-sacrificing-craft",
    excerpt: "Hard-won lessons on pricing early, maintaining code quality under pressure, and resisting the urge to prematurely scale.",
    content: "<p class=\"lead\">Hard-won lessons on pricing early, maintaining code quality under pressure, and resisting the urge to prematurely scale.</p><h2>The Discipline of Saying No</h2><p>In the early days of building a product, the temptation to chase every prospect's custom feature request is immense. Yet true product differentiation comes from doing three core workflows exceptionally well, rather than fifty poorly.</p><blockquote>\"Every customer who pays full price from day one teaches you more about real value than a thousand free beta testers combined.\"</blockquote><h3>Focus on Unit Economics</h3><p>Bootstrapped sustainability forces clean architectural decisions: low server overhead, transparent subscription models, and fanatical focus on customer retention.</p>",
    category: "Founder Notes",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    tags: ["Startups", "Founder", "Craft", "Business"],
    readingTime: 7,
    publishedAt: "Nov 8, 2026",
    authorId: "22222222-2222-4222-8222-222222222222",
    author: {
      name: "Marcus Chen",
      role: "Design Director & UI Lead",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
    },
    likes: 176,
    claps: 176,
    featured: false,
    trending: true,
    comments: []
  },
  {
    id: "a0000006-0000-4000-8000-000000000006",
    title: "Building a Frictionless Second Brain Using Local Plaintext & Markdown",
    slug: "building-a-frictionless-second-brain-using-local-plaintext-markdown",
    excerpt: "A resilient personal knowledge management system designed to survive vendor lock-in and foster genuine creative serendipity.",
    content: "<p class=\"lead\">A resilient personal knowledge management system designed to survive vendor lock-in and foster genuine creative serendipity.</p><h2>The Danger of Proprietary Silos</h2><p>Proprietary note-taking tools come and go, taking years of interconnected thoughts with them. Simple Markdown files stored locally in standard directories provide permanence, instant searchability via CLI grep, and complete data ownership.</p><blockquote>\"Your personal knowledge base should still be readable fifty years from now on whatever operating system exists then.\"</blockquote><h3>Atomic Notes & Bi-directional Links</h3><p>Keep each note focused on a single concept, and connect related thoughts with wiki-style references. Over time, recurring themes emerge organically.</p>",
    category: "Productivity",
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    tags: ["Productivity", "PKM", "Markdown", "Tools"],
    readingTime: 3,
    publishedAt: "Nov 10, 2026",
    authorId: "33333333-3333-4333-8333-333333333333",
    author: {
      name: "Aria Vance",
      role: "AI Researcher & Futurist",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80"
    },
    likes: 85,
    claps: 85,
    featured: false,
    trending: false,
    comments: []
  }
];
