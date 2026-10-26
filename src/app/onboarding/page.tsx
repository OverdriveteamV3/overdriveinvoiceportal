import type { Metadata } from "next";
import PolicyDocument from "@/components/home/PolicyDocument";
import { getLocale } from "@/lib/get-locale";
import { policyDocs } from "@/lib/policy-docs";

export async function generateMetadata(): Promise<Metadata> {
  const doc = policyDocs(await getLocale()).support;
  return { title: `${doc.title} | Over Drive`, description: doc.description };
}

export default async function OnboardingPage() {
  const locale = await getLocale();
  const doc = policyDocs(locale).support;
  return (
    <PolicyDocument title={doc.title} locale={locale} sections={doc.sections} />
  );
}
