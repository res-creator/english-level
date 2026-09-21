import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TelegramProvider } from "./telegram/TelegramProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { Layout } from "./components/Layout";
import { Today } from "./routes/Today";
import { Learn } from "./routes/Learn";
import { Review } from "./routes/Review";
import { Friends } from "./routes/Friends";
import { Profile } from "./routes/Profile";

export function App() {
  return (
    <TelegramProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/today" replace />} />
              <Route path="/today" element={<Today />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/review" element={<Review />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TelegramProvider>
  );
}
