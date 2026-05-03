/**
 * Local TF-IDF Hash Vectorizer
 *
 * Produces fixed 512-dimensional normalized vectors from text using a hashed
 * bag-of-words approach. Works entirely in pure JS with zero dependencies.
 *
 * Quality is lower than a neural embedding model but:
 *  - Fully deterministic (same text → same vector, always)
 *  - Instant (no network or GPU)
 *  - Good enough for keyword/topic-level document retrieval
 *  - Vectors are consistent within a single index, so cosine similarity works
 */

const DIM = 512;

// Common English stop words to skip
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'this','that','these','those','it','its','i','you','he','she','we','they',
  'not','no','if','as','so','up','out','about','into','than','then','when',
  'also','can','just','all','each','which','who','what','how','any','some',
]);

/**
 * Fast non-cryptographic hash of a string into [0, size).
 * Uses a variation of FNV-1a for good distribution.
 */
function hashWord(word, seed, size) {
  let h = (seed * 2166136261) >>> 0;
  for (let i = 0; i < word.length; i++) {
    h = Math.imul(h ^ word.charCodeAt(i), 16777619) >>> 0;
  }
  return h % size;
}

/**
 * Tokenize text into meaningful words.
 * Lowercases, strips punctuation, removes stop words and short tokens.
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Generate bigrams from a token list (adjacent word pairs).
 * Bigrams capture local context (e.g. "privacy policy", "net profit").
 */
function bigrams(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    out.push(tokens[i] + '_' + tokens[i + 1]);
  }
  return out;
}

/**
 * Generate a 512-dim normalized embedding vector for the given text.
 * Uses unigrams (weight 1.0) and bigrams (weight 0.6) with 4 hash seeds
 * to reduce collision artifacts.
 *
 * @param {string} text
 * @returns {number[]} 512-element normalized float array
 */
function embed(text) {
  const vector = new Float32Array(DIM);
  const tokens = tokenize(text);
  if (tokens.length === 0) return Array.from(vector);

  // TF: term frequency (normalized by doc length)
  const counts = {};
  for (const t of tokens) counts[t] = (counts[t] || 0) + 1;

  const unigrams = Object.entries(counts).map(([word, count]) => ({
    term: word,
    tf: count / tokens.length,
    weight: 1.0,
  }));

  // Bigrams get a slightly lower weight
  const bigramCounts = {};
  for (const bg of bigrams(tokens)) bigramCounts[bg] = (bigramCounts[bg] || 0) + 1;
  const bigramEntries = Object.entries(bigramCounts).map(([term, count]) => ({
    term,
    tf: count / Math.max(tokens.length - 1, 1),
    weight: 0.6,
  }));

  // Scatter each term across 4 hash buckets (reduces collisions)
  const seeds = [0, 1, 2, 3];
  const seedWeights = [1.0, 0.7, 0.5, 0.35];

  for (const { term, tf, weight } of [...unigrams, ...bigramEntries]) {
    for (let s = 0; s < seeds.length; s++) {
      const idx = hashWord(term, seeds[s], DIM);
      vector[idx] += tf * weight * seedWeights[s];
    }
  }

  // L2 normalize so cosine similarity = dot product
  let norm = 0;
  for (const v of vector) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < DIM; i++) vector[i] /= norm;
  }

  return Array.from(vector);
}

module.exports = { embed, DIM };
