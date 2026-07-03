import { extractKeywords } from './keyword-extractor.utils';

describe('extractKeywords', () => {
  // ----------------------------------------------------------------
  // Edge-case inputs
  // ----------------------------------------------------------------

  it('should return an empty array for an empty string', () => {
    expect(extractKeywords('')).toEqual([]);
  });

  it('should return an empty array for a whitespace-only string', () => {
    expect(extractKeywords('   \t\n  ')).toEqual([]);
  });

  it('should return an empty array when the text contains only stop words', () => {
    const result = extractKeywords('the and for are but not you');
    expect(result).toEqual([]);
  });

  it('should return an empty array when all tokens are shorter than 3 characters', () => {
    const result = extractKeywords('a b c d e f g h i j');
    expect(result).toEqual([]);
  });

  // ----------------------------------------------------------------
  // Core extraction behaviour
  // ----------------------------------------------------------------

  it('should return the most frequent keyword first', () => {
    const text = 'machine machine machine learning learning data';
    const result = extractKeywords(text);
    expect(result[0]).toBe('machine');
  });

  it('should return up to 10 keywords', () => {
    // 12 unique, all above min-length, none are stop words
    const text =
      'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda sigma ' +
      'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda sigma';
    const result = extractKeywords(text);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('should never return more than 10 keywords regardless of input size', () => {
    // Use pure-letter words (no digits) so they are not filtered out
    const words = [
      'alpha',
      'bravo',
      'charlie',
      'delta',
      'echo',
      'foxtrot',
      'golf',
      'hotel',
      'india',
      'juliet',
      'kilo',
      'lima',
    ];
    const repeatedText = words.join(' ').repeat(5);
    const result = extractKeywords(repeatedText);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('should return all available keywords when fewer than 10 meaningful words exist', () => {
    const text = 'javascript typescript python rust golang';
    const result = extractKeywords(text);
    expect(result).toHaveLength(5);
  });

  // ----------------------------------------------------------------
  // Normalisation
  // ----------------------------------------------------------------

  it('should return lowercase tokens only', () => {
    const text = 'JavaScript TypeScript PYTHON Rust GoLang';
    const result = extractKeywords(text);
    result.forEach((kw) => expect(kw).toBe(kw.toLowerCase()));
  });

  it('should strip punctuation and symbols from tokens and return only letters', () => {
    const text = 'machine! learning, data. science; artificial_intelligence';
    const result = extractKeywords(text);
    result.forEach((kw) => {
      expect(kw).toMatch(/^\p{L}+$/u);
    });
  });

  it('should handle text with newlines and tabs correctly', () => {
    const text = 'machine\nlearning\tdata\nscience';
    const result = extractKeywords(text);
    expect(result).toContain('machine');
    expect(result).toContain('learning');
    expect(result).toContain('data');
    expect(result).toContain('science');
  });

  it('should strip hyphens between words (e.g. compound terms) and return only letter segments', () => {
    const text = 'deep-learning neural-network image-processing';
    const result = extractKeywords(text);
    // Each hyphen-separated segment becomes a separate token; all must be letters only
    result.forEach((kw) => expect(kw).toMatch(/^\p{L}+$/u));
  });

  it('should discard purely numeric tokens', () => {
    const text =
      'algorithm 2024 calculates 404 results 100 times faster performance';
    const result = extractKeywords(text);
    result.forEach((kw) => expect(kw).toMatch(/^\p{L}+$/u));
    expect(result).toContain('algorithm');
    expect(result).toContain('calculates');
    expect(result).toContain('results');
    expect(result).toContain('performance');
    // No purely numeric tokens should appear
    expect(result).not.toContain('2024');
    expect(result).not.toContain('404');
    expect(result).not.toContain('100');
  });

  it('should discard mixed alphanumeric tokens (e.g. h2o, mp3, iso9001)', () => {
    const text =
      'documentation h2o mp3 format iso9001 standard version compliance';
    const result = extractKeywords(text);
    result.forEach((kw) => expect(kw).toMatch(/^\p{L}+$/u));
    expect(result).toContain('documentation');
    expect(result).toContain('compliance');
    // Mixed tokens must be absent
    expect(result).not.toContain('h2o');
    expect(result).not.toContain('mp3');
    expect(result).not.toContain('iso9001');
  });

  // ----------------------------------------------------------------
  // Stop-word filtering — Portuguese
  // ----------------------------------------------------------------

  it('should exclude common Portuguese stop words', () => {
    const text =
      'para que com uma nos das dos por mais isso inteligencia artificial';
    const result = extractKeywords(text);
    const ptStopWords = [
      'para',
      'que',
      'com',
      'uma',
      'nos',
      'das',
      'dos',
      'por',
      'mais',
      'isso',
    ];
    ptStopWords.forEach((sw) => expect(result).not.toContain(sw));
    expect(result).toContain('inteligencia');
    expect(result).toContain('artificial');
  });

  // ----------------------------------------------------------------
  // Stop-word filtering — English
  // ----------------------------------------------------------------

  it('should exclude common English stop words', () => {
    const text =
      'the and for are but not with from have this that they machine learning';
    const result = extractKeywords(text);
    const enStopWords = [
      'the',
      'and',
      'for',
      'are',
      'but',
      'not',
      'with',
      'from',
      'have',
      'this',
      'that',
      'they',
    ];
    enStopWords.forEach((sw) => expect(result).not.toContain(sw));
    expect(result).toContain('machine');
    expect(result).toContain('learning');
  });

  // ----------------------------------------------------------------
  // Uniqueness
  // ----------------------------------------------------------------

  it('should not return duplicate keywords', () => {
    const text = 'machine machine machine learning learning data data';
    const result = extractKeywords(text);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  // ----------------------------------------------------------------
  // Minimum length filter
  // ----------------------------------------------------------------

  it('should exclude tokens shorter than 3 characters', () => {
    const text = 'ai ml io blockchain distributed systems';
    const result = extractKeywords(text);
    result.forEach((kw) => expect(kw.length).toBeGreaterThanOrEqual(3));
    expect(result).toContain('blockchain');
    expect(result).toContain('distributed');
    expect(result).toContain('systems');
  });

  // ----------------------------------------------------------------
  // Realistic PDF-like input
  // ----------------------------------------------------------------

  it('should correctly identify keywords from a realistic PDF-like text snippet', () => {
    const text = `
      Introduction to Machine Learning

      Machine learning is a branch of artificial intelligence that focuses on
      building systems that learn from data. Machine learning algorithms are used
      in many applications, such as image recognition, natural language processing,
      and recommendation systems. Data science and machine learning often overlap,
      with data being central to both fields. Learning from large datasets requires
      efficient algorithms and significant computing resources.
    `;
    const result = extractKeywords(text);

    // "machine" and "learning" should both appear frequently and be in top results
    expect(result).toContain('machine');
    expect(result).toContain('learning');
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should work with Portuguese text from a realistic PDF snippet', () => {
    const text = `
      Introdução ao Processamento de Linguagem Natural

      O processamento de linguagem natural é uma área da inteligência artificial
      que busca permitir que computadores compreendam e gerem linguagem humana.
      Processamento de linguagem natural é amplamente utilizado em tradução
      automática, análise de sentimentos e classificação de documentos.
    `;
    const result = extractKeywords(text);

    expect(result).toContain('processamento');
    expect(result).toContain('linguagem');
    expect(result).toContain('natural');
    expect(result.length).toBeLessThanOrEqual(10);
  });

  // ----------------------------------------------------------------
  // Unicode support
  // ----------------------------------------------------------------

  it('should support accented characters (Portuguese/Spanish) in tokens', () => {
    const text = 'inteligência artificial análise dados computação distribuída';
    const result = extractKeywords(text);
    // Tokens should not be empty; accented chars are valid \p{L}
    expect(result.length).toBeGreaterThan(0);
    // All returned tokens must be letters only (no digits)
    result.forEach((kw) => expect(kw).toMatch(/^\p{L}+$/u));
  });
});
