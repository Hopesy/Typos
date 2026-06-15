import { getActivityStats } from './src/lib/content.js';

getActivityStats().then(stats => {
  console.log('Activity stats:', JSON.stringify(stats, null, 2));
}).catch(err => {
  console.error('Error:', err);
});
