/**
 * Tests for ServiceTable Component
 * Tests filtering, sorting, and search functionality
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceTable, Service } from '../ServiceTable';

// Mock services for testing
const mockServices: Service[] = [
  {
    id: '1',
    projectId: 'proj-1',
    serviceName: 'Cardiology',
    targetPage: 'https://clinic.ua/cardiology',
    country: 'UA',
    city: 'Kyiv',
    visibility_score: 75,
    position: 3,
    aiv_score: 78,
    pagespeed_score: 85,
    schema_score: 60,
  },
  {
    id: '2',
    projectId: 'proj-1',
    serviceName: 'Dermatology',
    targetPage: 'https://clinic.ua/dermatology',
    country: 'UA',
    city: 'Kyiv',
    visibility_score: 45,
    position: 8,
    aiv_score: 52,
    pagespeed_score: 72,
    schema_score: 75,
  },
  {
    id: '3',
    projectId: 'proj-1',
    serviceName: 'Pediatrics',
    targetPage: 'https://clinic.ua/pediatrics',
    country: 'UA',
    city: 'Lviv',
    visibility_score: 0,
    aiv_score: 28,
    pagespeed_score: 65,
    schema_score: 40,
  },
];

describe('ServiceTable', () => {
  describe('Rendering', () => {
    it('should render table with services', () => {
      render(<ServiceTable services={mockServices} />);
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
      expect(screen.getByText('Dermatology')).toBeInTheDocument();
      expect(screen.getByText('Pediatrics')).toBeInTheDocument();
    });

    it('should show empty state when no services', () => {
      render(<ServiceTable services={[]} />);
      expect(screen.getByText('No services found')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<ServiceTable services={[]} isLoading={true} />);
      expect(screen.getByText('Loading services...')).toBeInTheDocument();
    });

    it('should display service URLs', () => {
      render(<ServiceTable services={mockServices} />);
      expect(screen.getByText('https://clinic.ua/cardiology')).toBeInTheDocument();
    });

    it('should display cities', () => {
      render(<ServiceTable services={mockServices} />);
      expect(screen.getByText(/Kyiv/)).toBeInTheDocument();
      expect(screen.getByText(/Lviv/)).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('should filter by service name', async () => {
      const user = userEvent.setup();
      render(<ServiceTable services={mockServices} />);

      const searchInput = screen.getByPlaceholderText(/Search services/);
      await user.type(searchInput, 'Cardiology');

      expect(screen.getByText('Cardiology')).toBeInTheDocument();
      expect(screen.queryByText('Dermatology')).not.toBeInTheDocument();
    });

    it('should filter by URL', async () => {
      const user = userEvent.setup();
      render(<ServiceTable services={mockServices} />);

      const searchInput = screen.getByPlaceholderText(/Search services/);
      await user.type(searchInput, 'dermatology');

      expect(screen.getByText('Dermatology')).toBeInTheDocument();
      expect(screen.queryByText('Cardiology')).not.toBeInTheDocument();
    });

    it('should filter by city', async () => {
      const user = userEvent.setup();
      render(<ServiceTable services={mockServices} />);

      const searchInput = screen.getByPlaceholderText(/Search services/);
      await user.type(searchInput, 'Lviv');

      expect(screen.getByText('Pediatrics')).toBeInTheDocument();
      expect(screen.queryByText('Cardiology')).not.toBeInTheDocument();
    });

    it('should be case-insensitive', async () => {
      const user = userEvent.setup();
      render(<ServiceTable services={mockServices} />);

      const searchInput = screen.getByPlaceholderText(/Search services/);
      await user.type(searchInput, 'CARDIOLOGY');

      expect(screen.getByText('Cardiology')).toBeInTheDocument();
    });
  });

  describe('Visibility Filter', () => {
    it('should filter visible services only', async () => {
      const user = userEvent.setup();
      render(<ServiceTable services={mockServices} />);

      const visibilitySelect = screen.getByDisplayValue('All Services');
      await user.click(visibilitySelect);
      await user.click(screen.getByRole('option', { name: /Visible Only/ }));

      expect(screen.getByText('Cardiology')).toBeInTheDocument();
      expect(screen.getByText('Dermatology')).toBeInTheDocument();
      expect(screen.queryByText('Pediatrics')).not.toBeInTheDocument();
    });

    it('should filter hidden services only', async () => {
      const user = userEvent.setup();
      render(<ServiceTable services={mockServices} />);

      const visibilitySelect = screen.getByDisplayValue('All Services');
      await user.click(visibilitySelect);
      await user.click(screen.getByRole('option', { name: /Hidden Only/ }));

      expect(screen.queryByText('Cardiology')).not.toBeInTheDocument();
      expect(screen.getByText('Pediatrics')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by service name ascending', async () => {
      const user = userEvent.setup();
      const { container } = render(<ServiceTable services={mockServices} />);

      const serviceHeader = screen.getByText(/Service/);
      await user.click(serviceHeader);

      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0]).toHaveTextContent('Cardiology');
      expect(rows[1]).toHaveTextContent('Dermatology');
    });

    it('should sort by visibility score', async () => {
      const user = userEvent.setup();
      const { container } = render(<ServiceTable services={mockServices} />);

      const visibilityHeader = screen.getByText(/Visibility/);
      await user.click(visibilityHeader);

      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0]).toHaveTextContent('Cardiology'); // 75%
      expect(rows[1]).toHaveTextContent('Dermatology'); // 45%
    });

    it('should sort by AIV score', async () => {
      const user = userEvent.setup();
      const { container } = render(<ServiceTable services={mockServices} />);

      const aivHeader = screen.getByText(/AIV Score/);
      await user.click(aivHeader);

      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0]).toHaveTextContent('Cardiology'); // 78
      expect(rows[1]).toHaveTextContent('Dermatology'); // 52
    });

    it('should reverse sort direction', async () => {
      const user = userEvent.setup();
      const { container } = render(<ServiceTable services={mockServices} />);

      const aivHeader = screen.getByText(/AIV Score/);
      await user.click(aivHeader); // Ascending
      await user.click(aivHeader); // Descending

      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0]).toHaveTextContent('Cardiology');
      expect(rows[1]).toHaveTextContent('Dermatology');
    });
  });

  describe('Callbacks', () => {
    it('should call onServiceSelect when clicking view button', async () => {
      const onServiceSelect = jest.fn();
      const user = userEvent.setup();
      render(<ServiceTable services={mockServices} onServiceSelect={onServiceSelect} />);

      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);

      expect(onServiceSelect).toHaveBeenCalledWith(mockServices[0]);
    });

    it('should call onServiceDelete when clicking delete button', async () => {
      const onServiceDelete = jest.fn();
      const user = userEvent.setup();
      render(<ServiceTable services={mockServices} onServiceDelete={onServiceDelete} />);

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(onServiceDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('Badges', () => {
    it('should display visibility badges', () => {
      render(<ServiceTable services={mockServices} />);
      const badges = screen.getAllByText(/75%|45%|0%/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should show PageSpeed badges', () => {
      render(<ServiceTable services={mockServices} />);
      const badges = screen.getAllByText(/85|72|65/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should show Schema badges', () => {
      render(<ServiceTable services={mockServices} />);
      const badges = screen.getAllByText(/60%|75%|40%/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('Summary', () => {
    it('should show correct service count', () => {
      render(<ServiceTable services={mockServices} />);
      expect(screen.getByText(/Showing 3 of 3 services/)).toBeInTheDocument();
    });

    it('should update count on filter', async () => {
      const user = userEvent.setup();
      render(<ServiceTable services={mockServices} />);

      const searchInput = screen.getByPlaceholderText(/Search services/);
      await user.type(searchInput, 'Cardiology');

      expect(screen.getByText(/Showing 1 of 3 services/)).toBeInTheDocument();
    });
  });
});
