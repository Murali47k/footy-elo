import { render, screen } from '@testing-library/react';
import App from './App';

test('renders brand header and github repo link', () => {
  render(<App />);
  const brandElement = screen.getByRole('heading', { name: /FOOTY ELO/i });
  expect(brandElement).toBeInTheDocument();
  const githubLinks = screen.getAllByRole('link', { name: /github/i });
  expect(githubLinks.length).toBeGreaterThanOrEqual(1);
  expect(githubLinks[0]).toHaveAttribute('href', 'https://github.com/Murali47k/footy-elo');
});
