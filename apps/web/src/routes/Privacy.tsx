import { useNavigate } from "react-router-dom";
import { IconButton } from "../ui/Button.tsx";
import { IconArrowLeft } from "../ui/icons.tsx";

/**
 * What's collected, why, and how to leave — in plain language, not a
 * legal document. Static content, no API call: nothing here can be
 * "loading" or "wrong".
 */
export function Privacy() {
  const navigate = useNavigate();

  return (
    <section className="stack-lg">
      <header className="space-head">
        <IconButton label="Назад" onClick={() => navigate("/my")}>
          <IconArrowLeft size={19} />
        </IconButton>
        <div>
          <h1 className="h2">Что мы знаем о тебе</h1>
        </div>
      </header>

      <div className="stack-sm">
        <p className="body">
          Из Telegram мы используем только данные, которые нужны для работы
          приложения: имя и, если есть, username.
        </p>
        <p className="body">
          Также сохраняем твой прогресс: уровень, пройденные ситуации,
          результаты и то, что нужно повторить. Это нужно, чтобы приложение
          помнило, где ты остановился.
        </p>
        <p className="body">
          Напоминания можно выключить в любой момент в настройках.
        </p>
        <p className="body">Мы не используем твою переписку или контакты.</p>
        <p className="body">
          Если ты пригласишь друга, ему может быть виден только общий прогресс,
          связанный с совместной целью.
        </p>
        <p className="body">
          Удалить аккаунт можно в разделе «Мой английский» → «Удалить аккаунт».
          Профиль и прогресс будут удалены без возможности восстановления.
        </p>
        <p className="small muted">
          Обезличенные технические записи могут сохраняться, чтобы мы могли
          находить ошибки и улучшать приложение.
        </p>
      </div>
    </section>
  );
}
