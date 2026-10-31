import { GUIDES } from '@apexora/shared';
import GuideView from './GuideView';

export function generateStaticParams() {
  return GUIDES.map((g) => ({ code: g.code }));
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <GuideView code={code} />;
}
