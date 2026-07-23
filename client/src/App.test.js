import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main agriculture dashboard', () => {
  render(<App />);

  expect(screen.getByText('HAKGROS UZHAVAN')).toBeInTheDocument();
  expect(screen.getByText('Welcome to HAKGROS UZHAVAN')).toBeInTheDocument();
  expect(screen.getByText('Ask AI Advisor')).toBeInTheDocument();
});
