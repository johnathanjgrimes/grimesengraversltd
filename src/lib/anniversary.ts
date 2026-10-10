// 80th anniversary messaging stays hidden until config.anniversary.from. The site rebuilds itself
// every 1 January (see .github/workflows/deploy.yml), so it appears on the day without anyone deploying.
import config from '../data/config.json';

export const anniversary = new Date() >= new Date(`${config.anniversary.from}T00:00:00Z`);
export const anniversaryLabel = config.anniversary.label;
