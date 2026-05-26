import type { Request, Response } from 'express';

function getFakeChartData(req: Request, res: Response) {
  const result = {
    visitData: [
      { x: '2025-01-01', y: 70 },
      { x: '2025-01-02', y: 85 },
      { x: '2025-01-03', y: 62 },
      { x: '2025-01-04', y: 93 },
      { x: '2025-01-05', y: 78 },
      { x: '2025-01-06', y: 56 },
      { x: '2025-01-07', y: 88 },
    ],
    visitData2: [
      { x: '2025-01-01', y: 120 },
      { x: '2025-01-02', y: 95 },
      { x: '2025-01-03', y: 145 },
      { x: '2025-01-04', y: 110 },
      { x: '2025-01-05', y: 130 },
      { x: '2025-01-06', y: 160 },
      { x: '2025-01-07', y: 100 },
    ],
    salesData: [
      { x: '1月', y: 320 },
      { x: '2月', y: 450 },
      { x: '3月', y: 280 },
      { x: '4月', y: 520 },
      { x: '5月', y: 390 },
      { x: '6月', y: 410 },
    ],
    radarData: [
      { name: '个人', label: '引用', value: 10 },
      { name: '个人', label: '口碑', value: 8 },
      { name: '个人', label: '产量', value: 4 },
      { name: '个人', label: '贡献', value: 5 },
      { name: '个人', label: '热度', value: 7 },
      { name: '团队', label: '引用', value: 14 },
      { name: '团队', label: '口碑', value: 13 },
      { name: '团队', label: '产量', value: 11 },
      { name: '团队', label: '贡献', value: 14 },
      { name: '团队', label: '热度', value: 6 },
    ],
  };
  return res.json(result);
}

export default {
  'GET /api/mock/fake_analysis_chart_data': getFakeChartData,
};
