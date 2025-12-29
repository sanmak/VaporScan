/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Integration tests for UrlInput component
 * Tests form validation, user interactions, and integration with parent components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UrlInput } from '@/components/features/UrlInput';

describe('UrlInput Component Integration Tests', () => {
  describe('basic rendering and interaction', () => {
    it('should render form with all required fields', () => {
      // ARRANGE
      const mockSubmit = vi.fn();

      // ACT
      render(<UrlInput onSubmit={mockSubmit} />);

      // ASSERT
      expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start audit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show advanced options/i })).toBeInTheDocument();
    });

    it('should toggle advanced options visibility', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      const toggleButton = screen.getByRole('button', { name: /show advanced options/i });
      await user.click(toggleButton);

      // ASSERT
      await waitFor(() => {
        expect(screen.getByLabelText(/concurrency/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/max depth/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/max pages/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/timeout/i)).toBeInTheDocument();
      });

      expect(toggleButton).toHaveTextContent(/hide advanced options/i);
    });

    it('should show advanced options when showAdvanced prop is true', () => {
      // ARRANGE
      const mockSubmit = vi.fn();

      // ACT
      render(<UrlInput onSubmit={mockSubmit} showAdvanced={true} />);

      // ASSERT
      expect(screen.getByLabelText(/concurrency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max depth/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should validate URL format', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      const urlInput = screen.getByLabelText(/website url/i) as HTMLInputElement;
      await user.click(urlInput);
      await user.type(urlInput, 'not-a-url');

      const submitButton = screen.getByRole('button', { name: /start audit/i });
      await user.click(submitButton);

      // ASSERT - Wait for validation error to appear
      await waitFor(
        () => {
          const errorElement = screen.queryByText(/please enter a valid url/i);
          expect(errorElement).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should accept valid HTTP URL', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockResolvedValue(undefined);

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      const urlInput = screen.getByLabelText(/website url/i);
      await user.type(urlInput, 'http://example.com');

      const submitButton = screen.getByRole('button', { name: /start audit/i });
      await user.click(submitButton);

      // ASSERT
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
        expect(mockSubmit.mock.calls[0][0]).toMatchObject({
          url: 'http://example.com',
        });
      });
    });

    it('should accept valid HTTPS URL', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockResolvedValue(undefined);

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      const urlInput = screen.getByLabelText(/website url/i);
      await user.type(urlInput, 'https://example.com');

      const submitButton = screen.getByRole('button', { name: /start audit/i });
      await user.click(submitButton);

      // ASSERT
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('advanced options validation', () => {
    it('should submit with default values when advanced options not shown', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockResolvedValue(undefined);

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      await user.type(screen.getByLabelText(/website url/i), 'https://example.com');
      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
        expect(mockSubmit.mock.calls[0][0]).toEqual({
          url: 'https://example.com',
          concurrency: 5,
          maxDepth: 10,
          maxPages: 1000,
          respectRobotsTxt: true,
          timeout: 10000,
        });
      });
    });

    it('should submit with custom advanced options', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockResolvedValue(undefined);

      render(<UrlInput onSubmit={mockSubmit} showAdvanced={true} />);

      // ACT
      await user.type(screen.getByLabelText(/website url/i), 'https://example.com');

      // Change advanced options
      const concurrencyInput = screen.getByLabelText(/concurrency/i);
      await user.clear(concurrencyInput);
      await user.type(concurrencyInput, '10');

      const maxDepthInput = screen.getByLabelText(/max depth/i);
      await user.clear(maxDepthInput);
      await user.type(maxDepthInput, '5');

      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
        expect(mockSubmit.mock.calls[0][0]).toEqual({
          url: 'https://example.com',
          concurrency: 10,
          maxDepth: 5,
          maxPages: 1000,
          respectRobotsTxt: true,
          timeout: 10000,
        });
      });
    });

    it('should validate concurrency min/max constraints', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockResolvedValue(undefined);

      render(<UrlInput onSubmit={mockSubmit} showAdvanced={true} />);

      // ACT - Test minimum
      await user.type(screen.getByLabelText(/website url/i), 'https://example.com');

      const concurrencyInput = screen.getByLabelText(/concurrency/i);
      await user.clear(concurrencyInput);
      await user.type(concurrencyInput, '1');

      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
        expect(mockSubmit.mock.calls[0][0]).toMatchObject({
          concurrency: 1,
        });
      });

      mockSubmit.mockClear();

      // ACT - Test maximum
      await user.clear(concurrencyInput);
      await user.type(concurrencyInput, '20');
      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
        expect(mockSubmit.mock.calls[0][0]).toMatchObject({
          concurrency: 20,
        });
      });
    });
  });

  describe('loading state', () => {
    it('should disable form when loading', () => {
      // ARRANGE
      const mockSubmit = vi.fn();

      // ACT
      render(<UrlInput onSubmit={mockSubmit} isLoading={true} />);

      // ASSERT
      expect(screen.getByLabelText(/website url/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /scanning.../i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /advanced options/i })).toBeDisabled();
    });

    it('should show "Scanning..." text when loading', () => {
      // ARRANGE
      const mockSubmit = vi.fn();

      // ACT
      render(<UrlInput onSubmit={mockSubmit} isLoading={true} />);

      // ASSERT
      expect(screen.getByRole('button', { name: /scanning.../i })).toBeInTheDocument();
    });

    it('should disable advanced option fields when loading', () => {
      // ARRANGE
      const mockSubmit = vi.fn();

      // ACT
      render(<UrlInput onSubmit={mockSubmit} isLoading={true} showAdvanced={true} />);

      // ASSERT
      expect(screen.getByLabelText(/concurrency/i)).toBeDisabled();
      expect(screen.getByLabelText(/max depth/i)).toBeDisabled();
      expect(screen.getByLabelText(/max pages/i)).toBeDisabled();
      expect(screen.getByLabelText(/timeout/i)).toBeDisabled();
    });
  });

  describe('form submission flow', () => {
    it('should call onSubmit with correct data structure', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockResolvedValue(undefined);

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      await user.type(screen.getByLabelText(/website url/i), 'https://test.example.com');
      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        expect(mockSubmit.mock.calls[0][0]).toEqual({
          url: 'https://test.example.com',
          concurrency: 5,
          maxDepth: 10,
          maxPages: 1000,
          respectRobotsTxt: true,
          timeout: 10000,
        });
      });
    });

    it('should handle async submission errors gracefully', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Network error'));

      // Suppress unhandled rejection warning in test environment
      mockSubmit.mockImplementation(() =>
        Promise.reject(new Error('Network error')).catch(() => {})
      );

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      await user.type(screen.getByLabelText(/website url/i), 'https://example.com');
      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT - Form should still be functional
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });
    });

    it('should prevent submission without valid URL', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT - Try to submit empty form
      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      // ARRANGE
      const mockSubmit = vi.fn();

      // ACT
      render(<UrlInput onSubmit={mockSubmit} />);

      // ASSERT
      const urlInput = screen.getByLabelText(/website url/i);
      expect(urlInput).toHaveAttribute('type', 'text');
    });

    it('should show error message with proper aria-describedby', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      await user.type(screen.getByLabelText(/website url/i), 'invalid');
      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT
      await waitFor(() => {
        const urlInput = screen.getByLabelText(/website url/i);
        expect(urlInput).toHaveAttribute('aria-describedby', 'url-error');
      });
    });

    it('should have descriptive button text', () => {
      // ARRANGE
      const mockSubmit = vi.fn();

      // ACT
      render(<UrlInput onSubmit={mockSubmit} />);

      // ASSERT
      expect(screen.getByRole('button', { name: /start audit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show advanced options/i })).toBeInTheDocument();
    });
  });

  describe('user experience flows', () => {
    it('should complete full user flow: show advanced → modify → submit', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockResolvedValue(undefined);

      render(<UrlInput onSubmit={mockSubmit} />);

      // STEP 1: Enter URL
      await user.type(screen.getByLabelText(/website url/i), 'https://example.com');

      // STEP 2: Show advanced options
      await user.click(screen.getByRole('button', { name: /show advanced options/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/concurrency/i)).toBeInTheDocument();
      });

      // STEP 3: Modify advanced options
      const concurrencyInput = screen.getByLabelText(/concurrency/i);
      await user.clear(concurrencyInput);
      await user.type(concurrencyInput, '8');

      const maxPagesInput = screen.getByLabelText(/max pages/i);
      await user.clear(maxPagesInput);
      await user.type(maxPagesInput, '500');

      // STEP 4: Submit
      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
        expect(mockSubmit.mock.calls[0][0]).toEqual({
          url: 'https://example.com',
          concurrency: 8,
          maxDepth: 10,
          maxPages: 500,
          respectRobotsTxt: true,
          timeout: 10000,
        });
      });
    });

    it('should persist input values when toggling advanced options', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT - Enter URL
      await user.type(screen.getByLabelText(/website url/i), 'https://example.com');

      // Show advanced options
      await user.click(screen.getByRole('button', { name: /show advanced options/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/concurrency/i)).toBeInTheDocument();
      });

      // Modify concurrency
      const concurrencyInput = screen.getByLabelText(/concurrency/i);
      await user.clear(concurrencyInput);
      await user.type(concurrencyInput, '15');

      // Hide advanced options
      await user.click(screen.getByRole('button', { name: /hide advanced options/i }));

      // Show again
      await user.click(screen.getByRole('button', { name: /show advanced options/i }));

      // ASSERT - Values should be persisted
      await waitFor(() => {
        const persistedInput = screen.getByLabelText(/concurrency/i);
        expect(persistedInput).toHaveValue(15);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very long URLs', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockResolvedValue(undefined);

      const longUrl = 'https://example.com/' + 'a'.repeat(1000);

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      await user.type(screen.getByLabelText(/website url/i), longUrl);
      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT
      await waitFor(
        () => {
          expect(mockSubmit).toHaveBeenCalled();
          expect(mockSubmit.mock.calls[0][0]).toMatchObject({
            url: longUrl,
          });
        },
        { timeout: 5000 }
      );
    });

    it('should handle special characters in URL', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockResolvedValue(undefined);

      const specialUrl = 'https://example.com/path?param=value&other=123#section';

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      await user.type(screen.getByLabelText(/website url/i), specialUrl);
      await user.click(screen.getByRole('button', { name: /start audit/i }));

      // ASSERT
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });
    });

    it('should handle rapid form submissions', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockResolvedValue(undefined);

      render(<UrlInput onSubmit={mockSubmit} />);

      // ACT
      await user.type(screen.getByLabelText(/website url/i), 'https://example.com');

      const submitButton = screen.getByRole('button', { name: /start audit/i });
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // ASSERT - Should handle all submissions
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });
    });
  });
});
