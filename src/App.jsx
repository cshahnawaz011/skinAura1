import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ProductAnalytics from './pages/ProductAnalytics';
import SkinJournal from './pages/SkinJournal';
import GlowGoals from './pages/GlowGoals';
import UVTracker from './pages/UVTracker';
import SleepCoach from './pages/SleepCoach';
import HabitStreaks from './pages/HabitStreaks';
import SkinDiet from './pages/SkinDiet';
import BodyScanner from './pages/BodyScanner';
import SkincareQuiz from './pages/SkincareQuiz';
import DermDictionary from './pages/DermDictionary';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/ProductAnalytics" element={<LayoutWrapper currentPageName="ProductAnalytics"><ProductAnalytics /></LayoutWrapper>} />
      <Route path="/SkinJournal" element={<LayoutWrapper currentPageName="SkinJournal"><SkinJournal /></LayoutWrapper>} />
      <Route path="/GlowGoals" element={<LayoutWrapper currentPageName="GlowGoals"><GlowGoals /></LayoutWrapper>} />
      <Route path="/UVTracker" element={<LayoutWrapper currentPageName="UVTracker"><UVTracker /></LayoutWrapper>} />
      <Route path="/SleepCoach" element={<LayoutWrapper currentPageName="SleepCoach"><SleepCoach /></LayoutWrapper>} />
      <Route path="/HabitStreaks" element={<LayoutWrapper currentPageName="HabitStreaks"><HabitStreaks /></LayoutWrapper>} />
      <Route path="/SkinDiet" element={<LayoutWrapper currentPageName="SkinDiet"><SkinDiet /></LayoutWrapper>} />
      <Route path="/BodyScanner" element={<LayoutWrapper currentPageName="BodyScanner"><BodyScanner /></LayoutWrapper>} />
      <Route path="/SkincareQuiz" element={<LayoutWrapper currentPageName="SkincareQuiz"><SkincareQuiz /></LayoutWrapper>} />
      <Route path="/DermDictionary" element={<LayoutWrapper currentPageName="DermDictionary"><DermDictionary /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App