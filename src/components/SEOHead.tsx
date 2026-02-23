import { Helmet } from "react-helmet-async";

const BASE_URL = "https://www.chronoseducation.com";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
}

const SEOHead = ({ title, description, canonical }: SEOHeadProps) => {
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default SEOHead;
