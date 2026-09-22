import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TelegramProvider } from "./telegram/TelegramProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuthenticated } from "./auth/RequireAuthenticated";
import { RootRedirect } from "./RootRedirect";
import { Layout } from "./components/Layout";
import { Today } from "./routes/Today";
import { Learn } from "./routes/Learn";
import { ModuleDetail } from "./routes/ModuleDetail";
import { LessonPreview } from "./routes/LessonPreview";
import { Review } from "./routes/Review";
import { Friends } from "./routes/Friends";
import { Profile } from "./routes/Profile";
import { Placement } from "./routes/Placement";
import { PlacementResult } from "./routes/PlacementResult";
import { OnboardingIndex } from "./routes/onboarding/OnboardingIndex";
import { GoalsStep } from "./routes/onboarding/GoalsStep";
import { DailyTimeStep } from "./routes/onboarding/DailyTimeStep";
import { LevelStep } from "./routes/onboarding/LevelStep";
import { ReadyStep } from "./routes/onboarding/ReadyStep";

export function App() {
  return (
    <TelegramProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            <Route element={<Layout />}>
              <Route path="/today" element={<Today />} />
              <Route path="/learn" element={<Learn />} />
              <Route
                path="/learn/modules/:moduleId"
                element={<ModuleDetail />}
              />
              <Route
                path="/learn/lessons/:lessonId"
                element={<LessonPreview />}
              />
              <Route path="/review" element={<Review />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Onboarding and its placement handoff render full-screen,
                without the main app's bottom nav. */}
            <Route element={<RequireAuthenticated />}>
              <Route path="/onboarding" element={<OnboardingIndex />} />
              <Route path="/onboarding/goals" element={<GoalsStep />} />
              <Route path="/onboarding/time" element={<DailyTimeStep />} />
              <Route path="/onboarding/level" element={<LevelStep />} />
              <Route path="/onboarding/ready" element={<ReadyStep />} />
              <Route path="/placement" element={<Placement />} />
              <Route
                path="/placement/result/:attemptId"
                element={<PlacementResult />}
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TelegramProvider>
  );
}
