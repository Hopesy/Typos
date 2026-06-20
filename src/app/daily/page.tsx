import { getDailyEntries } from "@/lib/content";
import { DailyStream } from "@/components/daily-stream";
export const dynamic = 'force-dynamic';

export default async function DailyPage() {
  const fragments = await getDailyEntries();
  return <DailyStream fragments={fragments} />;
}
