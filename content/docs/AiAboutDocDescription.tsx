import { getAboutDocumentDescription } from '@/lib/ai/get-about-document-description';

export async function AiAboutDocDescription() {
  const description = await getAboutDocumentDescription();

  return (
    <p className="text-base leading-7 text-muted-foreground">
      {description}
    </p>
  );
}