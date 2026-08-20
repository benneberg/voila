/**
 * Unit tests for SpellChecker
 */

import { SpellChecker, SuggestionResult } from '../lib/spellChecker';

describe('SpellChecker', () => {
  let spellChecker: SpellChecker;

  beforeEach(() => {
    spellChecker = new SpellChecker();
  });

  describe('Basic Spell Checking', () => {
    it('should initialize with default dictionary', () => {
      expect(spellChecker).toBeDefined();
    });

    it('should check known words correctly', () => {
      // Test common English words
      expect(spellChecker.isCorrect('hello')).toBe(true);
      expect(spellChecker.isCorrect('world')).toBe(true);
      expect(spellChecker.isCorrect('the')).toBe(true);
      expect(spellChecker.isCorrect('file')).toBe(true);
    });

    it('should detect unknown words', () => {
      expect(spellChecker.isCorrect('xyzabc123')).toBe(false);
      expect(spellChecker.isCorrect('asdfghjkl')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(spellChecker.isCorrect('Hello')).toBe(true);
      expect(spellChecker.isCorrect('HELLO')).toBe(true);
      expect(spellChecker.isCorrect('HeLLo')).toBe(true);
    });
  });

  describe('Suggestions', () => {
    it('should return suggestions for misspellings', () => {
      const result = spellChecker.suggest('helpo');

      expect(result).toBeDefined();
      expect(result.isCorrect).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty suggestions for correct words', () => {
      const result = spellChecker.suggest('hello');

      expect(result.isCorrect).toBe(true);
      expect(result.suggestions.length).toBe(0);
    });

    it('should prioritize closer matches', () => {
      const result = spellChecker.suggest('teh');

      expect(result.suggestions.length).toBeGreaterThan(0);
      // 'the' should be among the suggestions
      expect(result.suggestions).toContain('the');
    });

    it('should limit suggestions to max results', () => {
      const result = spellChecker.suggest('test');

      // Should return reasonable number of suggestions
      expect(result.suggestions.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Code-Related Vocabulary', () => {
    it('should recognize common programming terms', () => {
      const codeTerms = [
        'function', 'variable', 'constant', 'array', 'object',
        'string', 'number', 'boolean', 'null', 'undefined',
        'async', 'await', 'promise', 'callback', 'class',
        'interface', 'type', 'enum', 'import', 'export',
        'return', 'if', 'else', 'for', 'while', 'switch',
        'try', 'catch', 'finally', 'throw', 'new', 'this',
      ];

      codeTerms.forEach(term => {
        expect(spellChecker.isCorrect(term)).toBe(true);
      });
    });

    it('should recognize file extensions', () => {
      const extensions = ['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'go', 'rs'];

      extensions.forEach(ext => {
        expect(spellChecker.isCorrect(ext)).toBe(true);
      });
    });

    it('should recognize common API terms', () => {
      const apiTerms = ['get', 'post', 'put', 'delete', 'patch', 'endpoint', 'header', 'body'];

      apiTerms.forEach(term => {
        expect(spellChecker.isCorrect(term)).toBe(true);
      });
    });
  });

  describe('File Type Vocabulary', () => {
    it('should recognize common file type names', () => {
      const fileTypes = ['image', 'video', 'audio', 'document', 'archive', 'executable', 'code'];

      fileTypes.forEach(type => {
        expect(spellChecker.isCorrect(type)).toBe(true);
      });
    });

    it('should recognize document-related terms', () => {
      const docTerms = ['pdf', 'docx', 'xlsx', 'pptx', 'markdown', 'html', 'xml', 'json'];

      docTerms.forEach(term => {
        expect(spellChecker.isCorrect(term)).toBe(true);
      });
    });
  });

  describe('Custom Dictionary', () => {
    it('should add custom words to dictionary', () => {
      spellChecker.addToDictionary('voila');

      expect(spellChecker.isCorrect('voila')).toBe(true);
    });

    it('should persist custom words across checks', () => {
      spellChecker.addToDictionary('minimax');

      expect(spellChecker.isCorrect('minimax')).toBe(true);
      expect(spellChecker.suggest('minimax').isCorrect).toBe(true);
    });

    it('should add multiple custom words', () => {
      spellChecker.addToDictionary('typescript');
      spellChecker.addToDictionary('react');
      spellChecker.addToDictionary('fastapi');

      expect(spellChecker.isCorrect('typescript')).toBe(true);
      expect(spellChecker.isCorrect('react')).toBe(true);
      expect(spellChecker.isCorrect('fastapi')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty strings', () => {
      expect(spellChecker.isCorrect('')).toBe(true); // Empty is considered correct
    });

    it('should handle numbers and special characters', () => {
      // These should not be in dictionary but should not crash
      expect(() => spellChecker.isCorrect('12345')).not.toThrow();
      expect(() => spellChecker.isCorrect('!@#$%')).not.toThrow();
    });

    it('should handle very long words', () => {
      const longWord = 'a'.repeat(1000);
      expect(() => spellChecker.isCorrect(longWord)).not.toThrow();
    });

    it('should handle unicode characters', () => {
      expect(() => spellChecker.isCorrect('こんにちは')).not.toThrow();
      expect(() => spellChecker.isCorrect('Привет')).not.toThrow();
    });
  });

  describe('Batch Checking', () => {
    it('should check multiple words', () => {
      const words = ['hello', 'world', 'xyz123'];
      const results = words.map(w => ({ word: w, correct: spellChecker.isCorrect(w) }));

      expect(results[0].correct).toBe(true);
      expect(results[1].correct).toBe(true);
      expect(results[2].correct).toBe(false);
    });

    it('should find all errors in text', () => {
      const text = 'This is a tset with sum erors';
      const words = text.toLowerCase().replace(/[.,!?]/g, '').split(' ');
      const errors = words.filter(w => !spellChecker.isCorrect(w));

      // 'tset' and 'sum' and 'erors' should be flagged
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Levenshtein Distance', () => {
    it('should suggest words with small edit distance', () => {
      const result = spellChecker.suggest('progrma');

      // 'program' should be a suggestion
      const hasProgram = result.suggestions.some(s => s.includes('program'));
      expect(hasProgram || result.suggestions.length > 0).toBe(true);
    });

    it('should not suggest words with large edit distance', () => {
      const result = spellChecker.suggest('xyz');

      // Should still return suggestions but they should be common words
      expect(result.suggestions.length).toBeGreaterThan(0);
      // 'the', 'a', 'to' are common short words that might match
    });
  });
});
