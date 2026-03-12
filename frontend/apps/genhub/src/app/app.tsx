import { Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { SEO } from '~/components/seo';
import { Navbar } from '~/components/layout/navbar';
import { AuthProvider } from '~/hooks/use-auth';
import { FeedPage } from '~/pages/feed';
import { LoginPage } from '~/pages/login';
import { SignupPage } from '~/pages/signup';
import { PromptPage } from '~/pages/prompt';
import { MediaDialog } from '~/components/feed/media-dialog';
import { getItemById } from '~/data/mock-gallery';

/** Modal overlay rendered when navigating to /prompt/:id from the feed. */
function PromptModal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = id ? getItemById(id) : null;

  if (!item) return <Navigate to="/" replace />;

  return (
    <MediaDialog
      item={item}
      open
      onOpenChange={(open) => {
        if (!open) navigate(-1);
      }}
    />
  );
}

export function App() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <SEO />
        <Navbar />
        <Routes location={state?.backgroundLocation || location}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/prompt/:id" element={<PromptPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>

        {/* When coming from feed, show the prompt as a modal overlay */}
        {state?.backgroundLocation && (
          <Routes>
            <Route path="/prompt/:id" element={<PromptModal />} />
          </Routes>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
