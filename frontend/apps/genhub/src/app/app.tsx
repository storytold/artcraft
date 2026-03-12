import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { SEO } from '~/components/seo';
import { Navbar } from '~/components/layout/navbar';
import { AuthProvider } from '~/hooks/use-auth';
import { FeedPage } from '~/pages/feed';
import { LoginPage } from '~/pages/login';
import { SignupPage } from '~/pages/signup';

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <SEO />
        <Navbar />
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
