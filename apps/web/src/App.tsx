import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TelegramProvider } from "./telegram/TelegramProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuthenticated } from "./auth/RequireAuthenticated";
import { RootRedirect } from "./RootRedirect";
import { Layout } from "./components/Layout";
import { Welcome } from "./routes/Welcome";
import { Demo } from "./routes/Demo";
import { DemoResult } from "./routes/DemoResult";
import { CompanionIntro } from "./routes/CompanionIntro";
import { Today } from "./routes/Today";
import { Course } from "./routes/Course";
import { EpisodePreview } from "./routes/EpisodePreview";
import { Session } from "./routes/Session";
import { SessionResult } from "./routes/SessionResult";
import { Review } from "./routes/Review";
import { MyEnglish } from "./routes/MyEnglish";
import { MySpace } from "./routes/MySpace";
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

            {/* The four daily destinations keep the bottom navigation.
                Review is deliberately not one of them — it surfaces from
                Today and from My Space, where it has a reason to exist. */}
            <Route element={<Layout />}>
              <Route path="/today" element={<Today />} />
              <Route path="/course" element={<Course />} />
              <Route path="/course/:episodeId" element={<EpisodePreview />} />
              <Route path="/my" element={<MyEnglish />} />
              <Route path="/my/space" element={<MySpace />} />
            </Route>

            {/* Focus mode and first use render full-screen, without the
                product navigation. The hook and the demo run before
                anything is asked for:
                no account, no placement, no saved state. */}
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/demo/result" element={<DemoResult />} />

            <Route element={<RequireAuthenticated />}>
              <Route path="/review" element={<Review />} />
              <Route
                path="/onboarding/companion"
                element={<CompanionIntro />}
              />
              <Route path="/onboarding" element={<OnboardingIndex />} />
              <Route path="/onboarding/goals" element={<GoalsStep />} />
              <Route path="/onboarding/level" element={<LevelStep />} />
              <Route path="/onboarding/time" element={<DailyTimeStep />} />
              <Route path="/onboarding/ready" element={<ReadyStep />} />
              <Route path="/placement" element={<Placement />} />
              <Route
                path="/placement/result/:attemptId"
                element={<PlacementResult />}
              />
              <Route path="/course/:episodeId/session" element={<Session />} />
              <Route
                path="/course/:episodeId/result/:sessionId"
                element={<SessionResult />}
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TelegramProvider>
  );
}
