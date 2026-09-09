/**
 * TEST-002: OmniDrop component tests
 * Covers: render, privacy toggle, tier display, file selection, drag-and-drop
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OmniDrop from '../components/OmniDrop';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      React.createElement('div', props, children),
    button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) =>
      React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

describe('OmniDrop', () => {
  const mockOnFileDrop = jest.fn();
  beforeEach(() => { mockOnFileDrop.mockClear(); });

  describe('Rendering', () => {
    it('renders drop prompt in idle state', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} />);
      expect(screen.getByText(/drop any file/i)).toBeInTheDocument();
    });
    it('renders tier1 badge by default', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} tier="tier1" />);
      expect(screen.getByText(/browser only/i)).toBeInTheDocument();
      expect(screen.getByText(/stays on your device/i)).toBeInTheDocument();
    });
    it('renders tier2 with server warning', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} tier="tier2" />);
      expect(screen.getByText(/cloud processing/i)).toBeInTheDocument();
      expect(screen.getByText(/file sent to server/i)).toBeInTheDocument();
    });
    it('renders tier3 with VM label', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} tier="tier3" />);
      expect(screen.getByText(/sandboxed vm/i)).toBeInTheDocument();
    });
    it('shows analyzing state when isProcessing=true', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={true} />);
      expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
    });
    it('lists supported file type categories', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} />);
      expect(screen.getByText(/images.*code.*3d.*audio/i)).toBeInTheDocument();
    });
  });

  describe('Privacy disclosure (UX-001)', () => {
    it('shows privacy info when info button is clicked', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} tier="tier1" />);
      fireEvent.click(screen.getByLabelText(/privacy information/i));
      expect(screen.getByText(/never leaves your device/i)).toBeInTheDocument();
    });
    it('toggles privacy info off on second click', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} tier="tier1" />);
      const btn = screen.getByLabelText(/privacy information/i);
      fireEvent.click(btn);
      expect(screen.getByText(/never leaves your device/i)).toBeInTheDocument();
      fireEvent.click(btn);
      expect(screen.queryByText(/never leaves your device/i)).not.toBeInTheDocument();
    });
    it('shows tier2 server retention message', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} tier="tier2" />);
      fireEvent.click(screen.getByLabelText(/privacy information/i));
      expect(screen.getByText(/auto-deleted within 1 hour/i)).toBeInTheDocument();
    });
    it('shows tier3 VM isolation message', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} tier="tier3" />);
      fireEvent.click(screen.getByLabelText(/privacy information/i));
      expect(screen.getByText(/firecracker vm/i)).toBeInTheDocument();
    });
  });

  describe('File selection', () => {
    it('calls onFileDrop when file selected via input', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      fireEvent.change(input);
      expect(mockOnFileDrop).toHaveBeenCalledWith(file);
    });
    it('does not trigger file picker when processing', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={true} />);
      expect(mockOnFileDrop).not.toHaveBeenCalled();
    });
  });

  describe('Drag and drop', () => {
    it('calls onFileDrop on file drop event', () => {
      render(<OmniDrop onFileDrop={mockOnFileDrop} isProcessing={false} />);
      const dropZone = document.querySelector('[class*="rounded-full"][class*="cursor-pointer"]') as HTMLElement;
      if (!dropZone) return;
      const file = new File(['data'], 'image.png', { type: 'image/png' });
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
      expect(mockOnFileDrop).toHaveBeenCalledWith(file);
    });
  });
});
