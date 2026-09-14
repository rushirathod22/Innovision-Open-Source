import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Built-in intelligent fallback flashcard templates for offline/dev or when Gemini quota is exceeded
const PRESET_TOPIC_DECKS = {
  "data structures": [
    {
      id: "ds-1",
      category: "Data Structures",
      question: "What is the primary difference between an Array and a Linked List in terms of memory allocation?",
      answer: "Arrays allocate memory contiguously with fixed size, allowing O(1) random access. Linked Lists allocate memory dynamically via pointers/nodes, allowing efficient O(1) insertions/deletions at known positions but O(n) access time.",
      hint: "Think about contiguous blocks vs pointer-based node references."
    },
    {
      id: "ds-2",
      category: "Data Structures",
      question: "What is the average time complexity of searching, inserting, and deleting in a Hash Map?",
      answer: "O(1) constant time on average, provided there is a good hash function that minimizes hash collisions. In the worst case (all collisions), it degrades to O(n).",
      hint: "Hash functions map keys directly to buckets."
    },
    {
      id: "ds-3",
      category: "Data Structures",
      question: "What property defines a Binary Search Tree (BST)?",
      answer: "For every node, all values in its left subtree are strictly less than the node's value, and all values in its right subtree are strictly greater than the node's value.",
      hint: "Left is smaller, right is larger."
    },
    {
      id: "ds-4",
      category: "Data Structures",
      question: "Explain the LIFO and FIFO principles and which data structures implement them.",
      answer: "LIFO (Last-In, First-Out) is implemented by Stacks (push/pop). FIFO (First-In, First-Out) is implemented by Queues (enqueue/dequeue).",
      hint: "Stack of plates vs cafeteria waiting line."
    },
    {
      id: "ds-5",
      category: "Data Structures",
      question: "When would you choose an Adjacency List over an Adjacency Matrix to represent a Graph?",
      answer: "An Adjacency List is preferred for sparse graphs (few edges) because it saves space (O(V + E) vs O(V^2)) and allows faster iteration over a vertex's neighbors.",
      hint: "Sparse graphs vs dense graphs space utilization."
    },
    {
      id: "ds-6",
      category: "Data Structures",
      question: "What is a Trie and what is its primary use case?",
      answer: "A Trie (prefix tree) is a tree-like data structure used to store strings character-by-character. It enables fast O(k) prefix lookups and autocomplete, where k is the length of the string.",
      hint: "Often used in search bar autocomplete."
    }
  ],
  "javascript": [
    {
      id: "js-1",
      category: "JavaScript",
      question: "What is a Closure in JavaScript?",
      answer: "A closure is a function that retains access to its lexical scope (outer variables) even when the function is executed outside of that lexical environment.",
      hint: "Inner functions remember where they were born."
    },
    {
      id: "js-2",
      category: "JavaScript",
      question: "What is the difference between '==' and '==='?",
      answer: "'==' performs abstract type coercion before comparing values, while '===' (strict equality) compares both value and type without converting types.",
      hint: "Coercion vs strict comparison."
    },
    {
      id: "js-3",
      category: "JavaScript",
      question: "How does the JavaScript Event Loop handle microtasks vs macrotasks?",
      answer: "The Event Loop executes the synchronous call stack first. Once empty, it processes all pending microtasks (Promises, queueMicrotask) before moving on to the next macrotask (setTimeout, setInterval, I/O).",
      hint: "Promises have higher priority than setTimeout."
    },
    {
      id: "js-4",
      category: "JavaScript",
      question: "What is the difference between 'let', 'const', and 'var'?",
      answer: "'var' is function-scoped and hoisted with an initial value of undefined. 'let' and 'const' are block-scoped and live in a Temporal Dead Zone until initialized. 'const' references cannot be reassigned.",
      hint: "Block scope vs function scope and reassignment."
    },
    {
      id: "js-5",
      category: "JavaScript",
      question: "What is Event Delegation?",
      answer: "Event delegation is a pattern of attaching a single event listener to a parent element instead of multiple child elements, leveraging event bubbling to catch events fired by children.",
      hint: "Bubbling upwards to a single parent handler."
    }
  ],
  "web development": [
    {
      id: "web-1",
      category: "Web Development",
      question: "What are the core differences between Server-Side Rendering (SSR) and Client-Side Rendering (CSR)?",
      answer: "SSR renders HTML on the server on each request, delivering faster First Contentful Paint and better SEO. CSR delivers a bare HTML shell and JavaScript bundle that compiles and renders HTML in the user's browser.",
      hint: "HTML generated on the server vs generated via browser JS."
    },
    {
      id: "web-2",
      category: "Web Development",
      question: "What is CORS and why is it enforced by browsers?",
      answer: "Cross-Origin Resource Sharing (CORS) is a browser security mechanism that uses HTTP headers to restrict resources from being requested by a domain different from the origin serving the page, preventing malicious cross-site data theft.",
      hint: "Same-Origin Policy protection."
    },
    {
      id: "web-3",
      category: "Web Development",
      question: "What is the purpose of HTTP/2 multiplexing?",
      answer: "Multiplexing allows multiple HTTP requests and responses to be sent concurrently over a single TCP connection, avoiding head-of-line blocking and reducing latency without domain sharding.",
      hint: "Multiple streams inside one connection."
    },
    {
      id: "web-4",
      category: "Web Development",
      question: "What is CSS Specificity hierarchy?",
      answer: "Inline styles (1000) > IDs (100) > Classes, attributes & pseudo-classes (10) > Elements and pseudo-elements (1). Universal selector (*) has 0 specificity.",
      hint: "Inline > ID > Class > Element."
    }
  ]
};

function generateFallbackCards(topic, count = 6) {
  const normalized = topic.toLowerCase().trim();
  for (const [key, cards] of Object.entries(PRESET_TOPIC_DECKS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return cards.slice(0, count);
    }
  }

  // Generic dynamic cards for any custom topic
  return Array.from({ length: Math.min(count, 6) }, (_, i) => ({
    id: `card-${Date.now()}-${i}`,
    category: topic || "General Learning",
    question: `Key Concept #${i + 1} for ${topic}: What is the foundational role of this concept?`,
    answer: `In ${topic}, this concept provides the core architecture, optimizing performance, maintainability, and clean separation of concerns for scalable implementations.`,
    hint: `Review the foundational definitions and best practices regarding ${topic}.`
  }));
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { topic, content, count = 6, difficulty = "intermediate" } = body;

    if (!topic && !content) {
      return NextResponse.json(
        { error: "Please provide either a topic or course content to generate flashcards." },
        { status: 400 }
      );
    }

    const cardCount = Math.min(Math.max(Number(count) || 6, 3), 12);
    const targetTopic = topic || "Course Topic";

    // Use Gemini AI if configured
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an elite educational tutor designing flashcards for active recall and spaced repetition.
Topic / Study Material:
${content ? content.slice(0, 8000) : targetTopic}

Difficulty Level: ${difficulty}
Target Card Count: ${cardCount}

Generate exactly ${cardCount} high-yield, engaging flashcards.
Return ONLY valid JSON (no markdown formatting, no backticks, no extra text) matching this schema:
[
  {
    "id": "1",
    "category": "${targetTopic.slice(0, 30)}",
    "question": "Concise, conceptual question testing core understanding",
    "answer": "Clear, informative answer explaining the reasoning (2-4 sentences)",
    "hint": "Helpful nudge or clue without giving away the direct answer"
  }
]`;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text().trim();
        const cleanedJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

        const cards = JSON.parse(cleanedJson);
        if (Array.isArray(cards) && cards.length > 0) {
          const validatedCards = cards.map((c, idx) => ({
            id: c.id || `card-${idx + 1}`,
            category: c.category || targetTopic,
            question: c.question || `Question ${idx + 1}`,
            answer: c.answer || "Answer explanation",
            hint: c.hint || "Think about the core principles."
          }));

          return NextResponse.json({
            success: true,
            topic: targetTopic,
            count: validatedCards.length,
            cards: validatedCards,
            source: "ai"
          });
        }
      } catch (aiError) {
        console.warn("[Flashcards API] Gemini generation failed, using intelligent fallback:", aiError.message);
      }
    }

    // Intelligent fallback for development, offline, or absent Gemini key
    const fallbackCards = generateFallbackCards(targetTopic, cardCount);
    return NextResponse.json({
      success: true,
      topic: targetTopic,
      count: fallbackCards.length,
      cards: fallbackCards,
      source: "fallback",
      message: "Generated using built-in smart flashcard library."
    });
  } catch (error) {
    console.error("[Flashcards API] Server error:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards. Please try again." },
      { status: 500 }
    );
  }
}
