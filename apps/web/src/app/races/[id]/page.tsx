import { RACES } from '@apexora/shared';
import LevelChoice from './LevelChoice';

export function generateStaticParams() {
  return RACES.map((r) => ({ id: r.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LevelChoice id={id} />;
}
