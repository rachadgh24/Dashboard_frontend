import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '@/app/(protected)/components/searchbar/page';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {},
  }),
}));

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar data={[]} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows all items when query is empty', () => {
    const data = ['Apple', 'Banana', 'Apricot'];
    render(<SearchBar data={data} />);
    const list = screen.getByText('Apple').closest('div')?.parentElement;
    expect(list).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Apricot')).toBeInTheDocument();
  });

  it('filters items as user types (case-insensitive)', async () => {
    const user = userEvent.setup();
    const data = ['Apple', 'Banana', 'Apricot', 'Pineapple'];
    render(<SearchBar data={data} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'app');
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Pineapple')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    expect(screen.queryByText('Apricot')).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'pine');
    expect(screen.getByText('Pineapple')).toBeInTheDocument();
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('shows no results when nothing matches', async () => {
    const user = userEvent.setup();
    const data = ['Apple', 'Banana'];
    render(<SearchBar data={data} />);
    await user.type(screen.getByRole('textbox'), 'xyz');
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('uses empty array when data prop is omitted', () => {
    render(<SearchBar />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    const container = document.querySelector('.mt-2');
    expect(container?.children.length ?? 0).toBe(0);
  });
});
