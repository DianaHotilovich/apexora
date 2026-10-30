import { GUIDES } from '@gridtrip/shared';
import SosView from './SosView';

export function generateStaticParams() {
  return GUIDES.map((g) => ({ code: g.code }));
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <SosView code={code} />;
}
