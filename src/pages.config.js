/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AiInsights from './pages/AiInsights';
import Community from './pages/Community';
import DermAI from './pages/DermAI';
import Education from './pages/Education';
import GamifiedTracker from './pages/GamifiedTracker';
import GlowMap from './pages/GlowMap';
import Home from './pages/Home';
import Lifestyle from './pages/Lifestyle';
import MakeupTryOn from './pages/MakeupTryOn';
import ProductComparison from './pages/ProductComparison';
import Products from './pages/Products';
import Progress from './pages/Progress';
import PublicProfile from './pages/PublicProfile';
import Quiz from './pages/Quiz';
import SkinAgePrediction from './pages/SkinAgePrediction';
import SkinAnalysis from './pages/SkinAnalysis';
import SkinChat from './pages/SkinChat';
import SkinReport from './pages/SkinReport';
import SkinRoutine from './pages/SkinRoutine';
import IngredientChecker from './pages/IngredientChecker';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AiInsights": AiInsights,
    "Community": Community,
    "DermAI": DermAI,
    "Education": Education,
    "GamifiedTracker": GamifiedTracker,
    "GlowMap": GlowMap,
    "Home": Home,
    "Lifestyle": Lifestyle,
    "MakeupTryOn": MakeupTryOn,
    "ProductComparison": ProductComparison,
    "Products": Products,
    "Progress": Progress,
    "PublicProfile": PublicProfile,
    "Quiz": Quiz,
    "SkinAgePrediction": SkinAgePrediction,
    "SkinAnalysis": SkinAnalysis,
    "SkinChat": SkinChat,
    "SkinReport": SkinReport,
    "SkinRoutine": SkinRoutine,
    "IngredientChecker": IngredientChecker,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};