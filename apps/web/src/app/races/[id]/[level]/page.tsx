import { RACES } from '@gridtrip/shared';
import PackageView from './PackageView';

export function generateStaticParams() {
  return RACES.flatMap((r) => ['budget', 'standard', 'premium'].map((level) => ({ id: r.id, level })));
}

export default async function Page({ params }: { params: Promise<{ id: string; level: string }> }) {
  const { id, level } = await params;
  return <PackageView id={id} level={level} />;
}
