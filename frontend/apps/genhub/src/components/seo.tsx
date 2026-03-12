import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'GenHub';
const DEFAULT_DESCRIPTION =
  'Discover, share, and remix AI-generated art and prompts. Browse a community-driven gallery of images created with Stable Diffusion, Midjourney, DALL-E, and more.';
const DEFAULT_OG_IMAGE = '/og-image.png';
const SITE_URL = 'https://genhub.app'; // TODO: replace with actual domain

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = DEFAULT_OG_IMAGE,
  url,
  type = 'website',
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullImageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  const canonicalUrl = url ? `${SITE_URL}${url}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify({ '@context': 'https://schema.org', ...jsonLd })}
        </script>
      )}
    </Helmet>
  );
}
