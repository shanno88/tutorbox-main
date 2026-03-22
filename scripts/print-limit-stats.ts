// scripts/print-limit-stats.ts
import 'dotenv/config';
import { db } from '@/server/db'; // 按你项目里实际路径改
import { sql } from 'drizzle-orm';

async function main() {
  console.log('=== Limit events by day & plan (last 30 days) ===');
  const byDay = await db.execute(sql`
    SELECT
      date_trunc('day', created_at) AS day,
      plan_slug,
      event_type,
      count(*) AS events
    FROM limit_events
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1, 2, 3
    ORDER BY day DESC, events DESC;
  `);
  console.table(byDay.rows as any[]);

  console.log('\n=== Limit events by month & user (last 6 months) ===');
  const byMonth = await db.execute(sql`
    SELECT
      date_trunc('month', created_at) AS month,
      user_id,
      event_type,
      count(*) AS events
    FROM limit_events
    WHERE created_at >= now() - interval '6 months'
    GROUP BY 1, 2, 3
    ORDER BY month DESC, events DESC;
  `);
  console.table(byMonth.rows as any[]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
