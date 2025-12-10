// Mock data for dashboard

export interface Competitor {
  name: string;
  score: number;
  mentions: number;
}

export const generateMockHistory = () => {
  const data = [];
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  for (let i = 0; i < months.length; i++) {
    data.push({
      name: months[i],
      score: 45 + Math.floor(Math.random() * 30) + (i * 2), // Upward trend
      competitorAvg: 50 + Math.floor(Math.random() * 10),
    });
  }
  return data;
};

export const MOCK_COMPETITORS: Competitor[] = [
  { name: 'City Dental Care', score: 82, mentions: 145 },
  { name: 'Smile Experts', score: 76, mentions: 120 },
  { name: 'MediClinic Plus', score: 65, mentions: 98 },
  { name: 'YourBrand (You)', score: 58, mentions: 84 },
  { name: 'HealthFirst', score: 45, mentions: 50 },
];

export const pieData = [
  { name: 'Product', value: 400, color: '#10b981' }, // Emerald 500
  { name: 'Blog', value: 300, color: '#06b6d4' },    // Cyan 500
  { name: 'Forum', value: 300, color: '#14b8a6' },   // Teal 500
];

