import HelioQuoteApp from "@/components/HelioQuoteApp";

export default async function QuoteDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HelioQuoteApp initialRoute="/quotes/[id]" initialQuoteId={id} />;
}
