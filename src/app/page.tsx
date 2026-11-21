import { HomeClient } from '@/components/home-client';
import { getDatabase } from '@/lib/database';
import { getPublicHomeData } from '@/lib/home-manage';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const initialData = await getPublicHomeData(await getDatabase());
  return <HomeClient initialData={initialData} />;
}
