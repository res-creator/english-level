-- Phase 4: placement test schema + original V1 question bank (placement_v1).
-- See docs/placement-test.md for the adaptive/scoring algorithm this content feeds.

PRAGMA foreign_keys = ON;

CREATE TABLE placement_passages (
  id TEXT PRIMARY KEY,
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2')),
  title TEXT,
  body TEXT NOT NULL
);

CREATE TABLE placement_questions (
  id TEXT PRIMARY KEY,
  test_version TEXT NOT NULL,
  skill TEXT NOT NULL CHECK (skill IN ('vocabulary', 'grammar', 'reading', 'active_english')),
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2')),
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'fill_gap_choice', 'reading_multiple_choice', 'typed_short_answer')),
  prompt TEXT NOT NULL,
  passage_id TEXT REFERENCES placement_passages (id),
  options_json TEXT,
  accepted_answers_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_placement_questions_bank ON placement_questions (test_version, skill, cefr_level, status);

CREATE TABLE placement_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  test_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  result_level TEXT CHECK (result_level IN ('A1', 'A2', 'B1', 'B2') OR result_level IS NULL),
  vocabulary_score INTEGER,
  grammar_score INTEGER,
  reading_score INTEGER,
  active_english_score INTEGER,
  strongest_skill TEXT,
  weakest_skill TEXT,
  current_level_pointer TEXT NOT NULL DEFAULT 'A2',
  consecutive_correct INTEGER NOT NULL DEFAULT 0,
  consecutive_incorrect INTEGER NOT NULL DEFAULT 0,
  answers_since_level_change INTEGER NOT NULL DEFAULT 0,
  current_question_id TEXT REFERENCES placement_questions (id)
);

CREATE INDEX idx_placement_attempts_user ON placement_attempts (user_id);

CREATE TABLE placement_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES placement_attempts (id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES placement_questions (id),
  answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  response_time_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (attempt_id, question_id)
);

-- Passages (shared by reading_multiple_choice questions at the same level)
INSERT INTO placement_passages (id, cefr_level, title, body) VALUES
  ('ppg_a1', 'A1', 'Sunshine Café', 'SUNSHINE CAFE
Open: Monday-Saturday, 8:00-18:00. Closed on Sunday.
Coffee $2. Tea $1.50. Sandwich $4.
Free wifi for customers.'),
  ('ppg_a2', 'A2', 'A birthday party', 'Hi Anna,
We''re having a small party on Saturday for Tom''s birthday. It starts at 7pm at our house. Please bring a friend if you want! Let me know if you can come.
See you soon,
Maria'),
  ('ppg_b1', 'B1', 'Traveling alone', 'Last summer, Tomas decided to travel alone for the first time. He was nervous at first, but after a few days in a new city, he started to enjoy exploring on his own. He met other travelers at his hostel, and by the end of the trip, he felt much more confident. Now he is already planning his next adventure.'),
  ('ppg_b2', 'B2', 'Remote work', 'Remote work has changed how many people think about their careers. Supporters argue that it gives employees more flexibility and reduces time wasted on commuting. Critics, however, point out that it can blur the line between work and personal life, making it harder for some people to switch off. Whether remote work suits someone often depends less on the job itself and more on how disciplined they are about setting boundaries.');

-- placement_v1 question bank: 64 questions (16 per skill, 16 per level)
INSERT INTO placement_questions (id, test_version, skill, cefr_level, question_type, prompt, passage_id, options_json, accepted_answers_json) VALUES
  ('pq_a1_read_1', 'placement_v1', 'reading', 'A1', 'reading_multiple_choice', 'What time does the cafe open?', 'ppg_a1', '["7:00","8:00","18:00","Sunday"]', '["8:00"]'),
  ('pq_a1_read_2', 'placement_v1', 'reading', 'A1', 'reading_multiple_choice', 'Which day is the cafe closed?', 'ppg_a1', '["Monday","Saturday","Sunday","Every day"]', '["Sunday"]'),
  ('pq_a1_read_3', 'placement_v1', 'reading', 'A1', 'reading_multiple_choice', 'How much is a sandwich?', 'ppg_a1', '["$1.50","$2","$4","$8"]', '["$4"]'),
  ('pq_a1_read_4', 'placement_v1', 'reading', 'A1', 'reading_multiple_choice', 'What is free at the cafe?', 'ppg_a1', '["Coffee","Tea","Wifi","Sandwiches"]', '["Wifi"]'),
  ('pq_a1_voc_1', 'placement_v1', 'vocabulary', 'A1', 'multiple_choice', 'Choose the correct word: I have two ___.', NULL, '["book","books","booking","booked"]', '["books"]'),
  ('pq_a1_voc_2', 'placement_v1', 'vocabulary', 'A1', 'multiple_choice', 'What is the opposite of ''big''?', NULL, '["small","tall","fast","happy"]', '["small"]'),
  ('pq_a1_voc_3', 'placement_v1', 'vocabulary', 'A1', 'multiple_choice', 'Which word is a color?', NULL, '["chair","green","run","Monday"]', '["green"]'),
  ('pq_a1_voc_4', 'placement_v1', 'vocabulary', 'A1', 'typed_short_answer', 'Complete the days of the week: Monday, Tuesday, Wednesday, ___.', NULL, NULL, '["thursday"]'),
  ('pq_a1_gram_1', 'placement_v1', 'grammar', 'A1', 'fill_gap_choice', 'She ___ a teacher.', NULL, '["is","are","am","be"]', '["is"]'),
  ('pq_a1_gram_2', 'placement_v1', 'grammar', 'A1', 'fill_gap_choice', 'I ___ from Spain.', NULL, '["am","is","are","be"]', '["am"]'),
  ('pq_a1_gram_3', 'placement_v1', 'grammar', 'A1', 'fill_gap_choice', 'They ___ students.', NULL, '["is","am","are","be"]', '["are"]'),
  ('pq_a1_gram_4', 'placement_v1', 'grammar', 'A1', 'typed_short_answer', 'Complete with the correct verb form: He ___ (like) pizza.', NULL, NULL, '["likes"]'),
  ('pq_a1_ae_1', 'placement_v1', 'active_english', 'A1', 'multiple_choice', 'Someone says ''Hello, how are you?'' The best reply is:', NULL, '["I''m fine, thanks.","Goodbye.","It''s a book.","Six o''clock."]', '["I''m fine, thanks."]'),
  ('pq_a1_ae_2', 'placement_v1', 'active_english', 'A1', 'multiple_choice', 'You want to buy bread. You say:', NULL, '["Can I have some bread, please?","The bread is blue.","Bread you today.","Seven bread."]', '["Can I have some bread, please?"]'),
  ('pq_a1_ae_3', 'placement_v1', 'active_english', 'A1', 'multiple_choice', 'Someone says ''Thank you.'' You reply:', NULL, '["You''re welcome.","Good morning.","I don''t know.","It''s Monday."]', '["You''re welcome."]'),
  ('pq_a1_ae_4', 'placement_v1', 'active_english', 'A1', 'multiple_choice', 'You meet someone new. You say:', NULL, '["Nice to meet you.","See you never.","I am angry.","Close the door."]', '["Nice to meet you."]'),
  ('pq_a2_read_1', 'placement_v1', 'reading', 'A2', 'reading_multiple_choice', 'What is the party for?', 'ppg_a2', '["Tom''s birthday","Maria''s birthday","A wedding","A meeting"]', '["Tom''s birthday"]'),
  ('pq_a2_read_2', 'placement_v1', 'reading', 'A2', 'reading_multiple_choice', 'What time does the party start?', 'ppg_a2', '["5pm","7am","7pm","9pm"]', '["7pm"]'),
  ('pq_a2_read_3', 'placement_v1', 'reading', 'A2', 'reading_multiple_choice', 'Where is the party?', 'ppg_a2', '["At a restaurant","At Maria''s house","At school","At the park"]', '["At Maria''s house"]'),
  ('pq_a2_read_4', 'placement_v1', 'reading', 'A2', 'reading_multiple_choice', 'What does Maria ask Anna to do?', 'ppg_a2', '["Bring food","Let her know if she can come","Buy a present","Call Tom"]', '["Let her know if she can come"]'),
  ('pq_a2_voc_1', 'placement_v1', 'vocabulary', 'A2', 'multiple_choice', 'Which word means ''not expensive''?', NULL, '["cheap","expensive","heavy","empty"]', '["cheap"]'),
  ('pq_a2_voc_2', 'placement_v1', 'vocabulary', 'A2', 'multiple_choice', 'I need to ___ money from the bank.', NULL, '["withdraw","wear","wash","wait"]', '["withdraw"]'),
  ('pq_a2_voc_3', 'placement_v1', 'vocabulary', 'A2', 'multiple_choice', 'What do you call a place where you buy medicine?', NULL, '["pharmacy","library","bakery","garage"]', '["pharmacy"]'),
  ('pq_a2_voc_4', 'placement_v1', 'vocabulary', 'A2', 'typed_short_answer', 'Complete: The opposite of ''early'' is ___.', NULL, NULL, '["late"]'),
  ('pq_a2_gram_1', 'placement_v1', 'grammar', 'A2', 'fill_gap_choice', 'Yesterday I ___ to the cinema.', NULL, '["go","goes","went","going"]', '["went"]'),
  ('pq_a2_gram_2', 'placement_v1', 'grammar', 'A2', 'fill_gap_choice', 'She ___ working here since 2019.', NULL, '["has been","have been","is","was"]', '["has been"]'),
  ('pq_a2_gram_3', 'placement_v1', 'grammar', 'A2', 'fill_gap_choice', 'If it rains, we ___ stay home.', NULL, '["will","would","did","was"]', '["will"]'),
  ('pq_a2_gram_4', 'placement_v1', 'grammar', 'A2', 'typed_short_answer', 'Complete with the past tense: Yesterday she (buy) ___ a new phone.', NULL, NULL, '["bought"]'),
  ('pq_a2_ae_1', 'placement_v1', 'active_english', 'A2', 'multiple_choice', 'Someone asks ''Do you mind if I sit here?'' A polite reply is:', NULL, '["Not at all, go ahead.","I hate chairs.","It''s Tuesday.","Close the window."]', '["Not at all, go ahead."]'),
  ('pq_a2_ae_2', 'placement_v1', 'active_english', 'A2', 'multiple_choice', 'You are late for a meeting. You say:', NULL, '["Sorry I''m late, the bus was delayed.","I never come.","Meetings are boring.","Give me the bus."]', '["Sorry I''m late, the bus was delayed."]'),
  ('pq_a2_ae_3', 'placement_v1', 'active_english', 'A2', 'multiple_choice', 'A friend says ''I passed my exam!'' You reply:', NULL, '["Congratulations!","That''s terrible.","I''m hungry.","Close the door."]', '["Congratulations!"]'),
  ('pq_a2_ae_4', 'placement_v1', 'active_english', 'A2', 'multiple_choice', 'You want to politely disagree. You say:', NULL, '["I see your point, but I think...","You are wrong.","No way, never.","Whatever."]', '["I see your point, but I think..."]'),
  ('pq_b1_read_1', 'placement_v1', 'reading', 'B1', 'reading_multiple_choice', 'How did Tomas feel at the beginning of the trip?', 'ppg_b1', '["Nervous","Confident","Angry","Bored"]', '["Nervous"]'),
  ('pq_b1_read_2', 'placement_v1', 'reading', 'B1', 'reading_multiple_choice', 'Where did Tomas meet other travelers?', 'ppg_b1', '["At the airport","At his hostel","At work","At school"]', '["At his hostel"]'),
  ('pq_b1_read_3', 'placement_v1', 'reading', 'B1', 'reading_multiple_choice', 'How did Tomas feel by the end of the trip?', 'ppg_b1', '["More confident","More nervous","Sad","Tired"]', '["More confident"]'),
  ('pq_b1_read_4', 'placement_v1', 'reading', 'B1', 'reading_multiple_choice', 'What is Tomas planning now?', 'ppg_b1', '["To stay home","His next adventure","To find a job","To sell his house"]', '["His next adventure"]'),
  ('pq_b1_voc_1', 'placement_v1', 'vocabulary', 'B1', 'multiple_choice', 'Choose the word closest in meaning to ''exhausted'':', NULL, '["very tired","very happy","very angry","very hungry"]', '["very tired"]'),
  ('pq_b1_voc_2', 'placement_v1', 'vocabulary', 'B1', 'multiple_choice', '''To postpone a meeting'' means to:', NULL, '["delay it","cancel it","start it early","attend it"]', '["delay it"]'),
  ('pq_b1_voc_3', 'placement_v1', 'vocabulary', 'B1', 'multiple_choice', 'A synonym for ''reliable'' is:', NULL, '["dependable","expensive","boring","quick"]', '["dependable"]'),
  ('pq_b1_voc_4', 'placement_v1', 'vocabulary', 'B1', 'typed_short_answer', 'Complete: If something is ''affordable'', it means it is not too ___.', NULL, NULL, '["expensive"]'),
  ('pq_b1_gram_1', 'placement_v1', 'grammar', 'B1', 'fill_gap_choice', 'By the time we arrived, the film ___ already started.', NULL, '["had","has","was","is"]', '["had"]'),
  ('pq_b1_gram_2', 'placement_v1', 'grammar', 'B1', 'fill_gap_choice', 'I wish I ___ more time to finish this.', NULL, '["had","have","has","having"]', '["had"]'),
  ('pq_b1_gram_3', 'placement_v1', 'grammar', 'B1', 'fill_gap_choice', 'The report ___ by the manager before it is sent.', NULL, '["must be checked","must check","must checked","must be check"]', '["must be checked"]'),
  ('pq_b1_gram_4', 'placement_v1', 'grammar', 'B1', 'typed_short_answer', 'Complete with the correct form: She suggested (go) ___ to the new restaurant.', NULL, NULL, '["going"]'),
  ('pq_b1_ae_1', 'placement_v1', 'active_english', 'B1', 'multiple_choice', 'You want to interrupt politely in a meeting. You say:', NULL, '["Sorry to interrupt, but can I add something?","Stop talking now.","This is boring.","Be quiet."]', '["Sorry to interrupt, but can I add something?"]'),
  ('pq_b1_ae_2', 'placement_v1', 'active_english', 'B1', 'multiple_choice', 'A colleague asks for feedback on their work. A diplomatic reply is:', NULL, '["It''s good, but a few things could be clearer.","It''s terrible.","I didn''t read it.","Do it again."]', '["It''s good, but a few things could be clearer."]'),
  ('pq_b1_ae_3', 'placement_v1', 'active_english', 'B1', 'multiple_choice', 'You need to cancel plans last minute. You say:', NULL, '["I''m really sorry, something came up - can we reschedule?","I''m not coming, bye.","Plans are cancelled.","Never mind."]', '["I''m really sorry, something came up - can we reschedule?"]'),
  ('pq_b1_ae_4', 'placement_v1', 'active_english', 'B1', 'multiple_choice', 'Someone offers you help you don''t need. A polite reply is:', NULL, '["Thanks, but I think I''ve got it.","No.","Go away.","I don''t need you."]', '["Thanks, but I think I''ve got it."]'),
  ('pq_b2_read_1', 'placement_v1', 'reading', 'B2', 'reading_multiple_choice', 'According to supporters, what is one benefit of remote work?', 'ppg_b2', '["More flexibility","Higher salary","Less responsibility","Free travel"]', '["More flexibility"]'),
  ('pq_b2_read_2', 'placement_v1', 'reading', 'B2', 'reading_multiple_choice', 'What concern do critics raise about remote work?', 'ppg_b2', '["It blurs work and personal life","It is too expensive","It requires travel","It reduces flexibility"]', '["It blurs work and personal life"]'),
  ('pq_b2_read_3', 'placement_v1', 'reading', 'B2', 'reading_multiple_choice', 'According to the text, what mainly determines whether remote work suits someone?', 'ppg_b2', '["Their discipline with boundaries","Their job title","Their salary","Their commute time"]', '["Their discipline with boundaries"]'),
  ('pq_b2_read_4', 'placement_v1', 'reading', 'B2', 'reading_multiple_choice', 'What does ''switch off'' mean in this context?', 'ppg_b2', '["Stop thinking about work","Turn off a device","Leave a job","Start a new task"]', '["Stop thinking about work"]'),
  ('pq_b2_voc_1', 'placement_v1', 'vocabulary', 'B2', 'multiple_choice', '''To blur the line between two things'' means to make the difference between them:', NULL, '["less clear","more clear","more important","disappear completely"]', '["less clear"]'),
  ('pq_b2_voc_2', 'placement_v1', 'vocabulary', 'B2', 'multiple_choice', 'A word close in meaning to ''discipline'' (in this context) is:', NULL, '["self-control","punishment","schedule","energy"]', '["self-control"]'),
  ('pq_b2_voc_3', 'placement_v1', 'vocabulary', 'B2', 'multiple_choice', '''Commuting'' refers to:', NULL, '["traveling to and from work","working from home","taking a holiday","changing jobs"]', '["traveling to and from work"]'),
  ('pq_b2_voc_4', 'placement_v1', 'vocabulary', 'B2', 'typed_short_answer', 'Complete: Someone who works for themselves, without an employer, is ___-employed.', NULL, NULL, '["self"]'),
  ('pq_b2_gram_1', 'placement_v1', 'grammar', 'B2', 'fill_gap_choice', '___ the weather, the event went ahead as planned.', NULL, '["Despite","Although","Because","Unless"]', '["Despite"]'),
  ('pq_b2_gram_2', 'placement_v1', 'grammar', 'B2', 'fill_gap_choice', 'Not only ___ late, but it also contained several errors.', NULL, '["was the report","the report was","is the report","the report is"]', '["was the report"]'),
  ('pq_b2_gram_3', 'placement_v1', 'grammar', 'B2', 'fill_gap_choice', 'Had I known about the delay, I ___ earlier.', NULL, '["would have left","will leave","would leave","had left"]', '["would have left"]'),
  ('pq_b2_gram_4', 'placement_v1', 'grammar', 'B2', 'typed_short_answer', 'Complete with the correct form: I''d rather you (not / tell) ___ him yet.', NULL, NULL, '["didn''t tell","did not tell"]'),
  ('pq_b2_ae_1', 'placement_v1', 'active_english', 'B2', 'multiple_choice', 'You want to politely challenge an idea in a discussion. You say:', NULL, '["I see where you''re coming from, but have you considered...","That''s a bad idea.","No, you''re wrong.","I disagree completely."]', '["I see where you''re coming from, but have you considered..."]'),
  ('pq_b2_ae_2', 'placement_v1', 'active_english', 'B2', 'multiple_choice', 'You want to soften bad news. You start with:', NULL, '["I''m afraid there''s been a slight problem.","Bad news.","This is a disaster.","It''s over."]', '["I''m afraid there''s been a slight problem."]'),
  ('pq_b2_ae_3', 'placement_v1', 'active_english', 'B2', 'multiple_choice', 'You want to end a call professionally. You say:', NULL, '["Thanks for your time, I''ll follow up by email.","Bye.","I''m hanging up now.","That''s all."]', '["Thanks for your time, I''ll follow up by email."]'),
  ('pq_b2_ae_4', 'placement_v1', 'active_english', 'B2', 'multiple_choice', 'Someone asks a favor you can''t do. A diplomatic reply is:', NULL, '["I''d love to help, but I''m not able to this time.","No.","Ask someone else.","I don''t want to."]', '["I''d love to help, but I''m not able to this time."]');
