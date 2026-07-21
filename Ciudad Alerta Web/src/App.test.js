import { render, screen } from '@testing-library/react';
import App from './App';

test('renders CiudadAlerta brand', () => {
  render(<App />);
  const brandElement = screen.getByText(/CiudadAlerta/i);
  expect(brandElement).toBeInTheDocument();
});
