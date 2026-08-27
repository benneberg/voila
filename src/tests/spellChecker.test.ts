/**
 * Unit tests for SpellChecker
 */

import { SpellChecker } from '../lib/spellChecker';
import type { SuggestionResult } from '../lib/spellChecker';

describe('SpellChecker', () => {
  let spellChecker: SpellChecker;

  beforeEach(() => {
    spellChecker = new SpellChecker();
  });

  describe('Basic Spell Checking', () => {
    it('should initialize successfully', () => {
      expect(spellChecker).toBeDefined();
    });

    it('should recognise common English words', () => {
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
      const result: SuggestionResult = spellChecker.suggest('helpo');
      expect(result).toBeDefined();
      expect(result.isCorrect).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should return isCorrect=true for correct words', () => {
      const result = spellChecker.suggest('hello');
      expect(result.isCorrect).toBe(true);
      expect(result.suggestions.length).toBe(0);
    });

    it('should prioritise closer matches for teh', () => {
      const result = spellChecker.suggest('teh');
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain('the');
    });

    it('should limit suggestions to a reasonable number', () => {
      const result = spellChecker.suggest('tset');
      expect(result.suggestions.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Code-Related Vocabulary', () => {
    it('should recognise programming keywords', () => {
      const terms = [
        'function','variable','array','object','string','number','boolean',
        'null','undefined','async','await','promise','callback','class',
        'interface','type','enum','import','export','return',
        'if','else','for','while','switch','try','catch','finally',
      ];
      terms.forEach(term => {
        expect(spellChecker.isCorrect(term)).toBe(true);
      });
    });

    it('should recognise file extensions as words', () => {
      ['py','js','ts','jsx','tsx','java','cpp','c','go','rs'].forEach(ext => {
        expect(spellChecker.isCorrect(ext)).toBe(true);
      });
    });

    it('should recognise HTTP method names', () => {
      ['get','post','put','delete','patch'].forEach(method => {
        expect(spellChecker.isCorrect(method)).toBe(true);
      });
    });
  });

  describe('File Type Vocabulary', () => {
    it('should recognise file type category names', () => {
      ['image','video','audio','document','archive','executable','code','data'].forEach(t => {
        expect(spellChecker.isCorrect(t)).toBe(true);
      });
    });

    it('should recognise common format names', () => {
      ['pdf','docx','xlsx','pptx','markdown','html','xml','json'].forEach(f => {
        expect(spellChecker.isCorrect(f)).toBe(true);
      });
    });
  });

  describe('Custom Dictionary', () => {
    it('should add and recognise custom words', () => {
      spellChecker.addToDictionary('voila');
      expect(spellChecker.isCorrect('voila')).toBe(true);
    });

    it('should persist custom words across multiple calls', () => {
      spellChecker.addToDictionary('minimax');
      expect(spellChecker.isCorrect('minimax')).toBe(true);
      expect(spellChecker.suggest('minimax').isCorrect).toBe(true);
    });

    it('should add multiple custom words independently', () => {
      spellChecker.addToDictionary('typescript');
      spellChecker.addToDictionary('react');
      spellChecker.addToDictionary('fastapi');
      expect(spellChecker.isCorrect('typescript')).toBe(true);
      expect(spellChecker.isCorrect('react')).toBe(true);
      expect(spellChecker.isCorrect('fastapi')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should treat empty strings as correct', () => {
      expect(spellChecker.isCorrect('')).toBe(true);
    });

    it('should not throw on numbers or special characters', () => {
      expect(() => spellChecker.isCorrect('12345')).not.toThrow();
      expect(() => spellChecker.isCorrect('!@#$%')).not.toThrow();
    });

    it('should not throw on very long strings', () => {
      expect(() => spellChecker.isCorrect('a'.repeat(500))).not.toThrow();
    });

    it('should not throw on unicode', () => {
      expect(() => spellChecker.isCorrect('こんにちは')).not.toThrow();
      expect(() => spellChecker.isCorrect('Привет')).not.toThrow();
    });
  });

  describe('Batch Checking', () => {
    it('should correctly evaluate a mixed list of words', () => {
      const results = ['hello','world','xyz123'].map(w => spellChecker.isCorrect(w));
      expect(results[0]).toBe(true);
      expect(results[1]).toBe(true);
      expect(results[2]).toBe(false);
    });
  });

  describe('Levenshtein Distance', () => {
    it('should surface nearby matches for common typos', () => {
      const result = spellChecker.suggest('helllo');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should not throw on very short words', () => {
      expect(() => spellChecker.suggest('xyz')).not.toThrow();
    });
  });
});
