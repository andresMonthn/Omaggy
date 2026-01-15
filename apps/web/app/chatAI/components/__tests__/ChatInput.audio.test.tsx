// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInput } from '../ChatInput';

declare global {
  interface Window {
    audio?: {
      start: (config?: unknown) => void;
      stop: () => void;
      onTranscript: (cb: (text: string) => void) => () => void;
      __triggerTranscript?: (text: string) => void;
    };
  }
}

describe('ChatInput audio flow', () => {
  const originalAudio = window.audio;

  beforeEach(() => {
    const callbacks: Array<(text: string) => void> = [];

    const onTranscript = (cb: (text: string) => void) => {
      callbacks.push(cb);
      return () => {
        const index = callbacks.indexOf(cb);
        if (index >= 0) {
          callbacks.splice(index, 1);
        }
      };
    };

    const triggerTranscript = (text: string) => {
      callbacks.forEach((cb) => cb(text));
    };

    const start = vi.fn();
    const stop = vi.fn();

    // @ts-ignore
    window.audio = {
      start,
      stop,
      onTranscript,
      __triggerTranscript: triggerTranscript,
    };
  });

  afterEach(() => {
    window.audio = originalAudio;
  });

  it('inicia captura y actualiza el texto con transcripciones parciales', async () => {
    const handleSend = vi.fn();
    render(<ChatInput onSend={handleSend} disabled={false} />);

    const micButton = screen.getByLabelText('Voice input');
    fireEvent.click(micButton);

    const audioAny = window.audio as any;
    expect(audioAny.start).toHaveBeenCalledWith({ source: 'mic' });

    audioAny.__triggerTranscript('hola mundo');

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Inicia la entrevista') as HTMLInputElement;
      expect(input.value).toBe('hola mundo');
    });

    const input = screen.getByPlaceholderText('Inicia la entrevista') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hola mundo editado' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    expect(handleSend).toHaveBeenCalledWith('hola mundo editado');
    expect(audioAny.stop).toHaveBeenCalledTimes(1);
  });
});

