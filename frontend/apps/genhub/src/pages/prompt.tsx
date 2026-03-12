import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { SEO } from '~/components/seo';
import { MediaDetail } from '~/components/feed/media-detail';
import { getItemById } from '~/data/mock-gallery';

export function PromptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = id ? getItemById(id) : null;

  if (!item) return <Navigate to="/" replace />;

  return (
    <>
      <SEO
        title={item.title}
        description={item.prompt.length > 155 ? `${item.prompt.slice(0, 152)}...` : item.prompt}
        image={item.imageUrl}
        url={`/prompt/${item.id}`}
        type="article"
        keywords={`${item.model}, AI art, ${item.tags.join(', ')}`}
        jsonLd={{
          '@type': 'CreativeWork',
          name: item.title,
          description: item.prompt,
          image: item.imageUrl,
          author: { '@type': 'Person', name: item.creator },
          datePublished: item.createdAt,
        }}
      />

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-5 gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to Gallery
        </Button>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Image */}
          <div className="flex flex-1 items-start justify-center overflow-hidden rounded-xl bg-muted">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full rounded-xl object-cover"
              style={{ maxHeight: '80vh' }}
            />
          </div>

          {/* Detail panel */}
          <div className="w-full rounded-xl border md:w-[400px] md:shrink-0">
            <MediaDetail item={item} />
          </div>
        </div>
      </div>
    </>
  );
}
