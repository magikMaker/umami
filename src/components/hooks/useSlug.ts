import { useConfig } from '@/components/hooks/useConfig';
import { LINKS_URL, PIXELS_URL, POSTBACKS_URL, REDIRECTS_URL } from '@/lib/constants';

export function useSlug(type: 'link' | 'pixel' | 'postback' | 'redirect') {
  const { linksUrl, pixelsUrl, postbacksUrl, redirectsUrl } = useConfig();

  const getHostUrl = () => {
    switch (type) {
      case 'link':
        return linksUrl || LINKS_URL;
      case 'pixel':
        return pixelsUrl || PIXELS_URL;
      case 'postback':
        return postbacksUrl || POSTBACKS_URL;
      case 'redirect':
        return redirectsUrl || REDIRECTS_URL;
    }
  };

  const hostUrl = getHostUrl();

  const getSlugUrl = (slug: string) => {
    return `${hostUrl}/${slug}`;
  };

  return { getSlugUrl, hostUrl };
}
