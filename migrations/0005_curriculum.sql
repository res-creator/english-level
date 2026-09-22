-- Phase 5: curriculum & content foundation. Schema only — no content rows.
-- Content is seeded separately via the idempotent import tooling in
-- apps/api/src/content/ from data files under seeds/content/. See
-- docs/curriculum.md for the full model and docs/content-authoring.md for
-- how to add content.
--
-- Structure: levels (Phase 1) -> modules -> lessons -> lesson_items, where
-- lesson_items points at reusable content (learning_items / grammar_patterns)
-- rather than storing copies. lesson_items.content_id is polymorphic
-- (learning_item vs grammar_pattern) and therefore has no single DB-level
-- FK — referential integrity for it is enforced by the content
-- validator/seed tooling, not SQLite.

PRAGMA foreign_keys = ON;

CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels (id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  content_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_modules_level_order ON modules (level_id, order_index);

CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL CHECK (
    lesson_type IN ('vocabulary', 'grammar', 'mixed', 'reading', 'practice', 'checkpoint')
  ),
  order_index INTEGER NOT NULL,
  estimated_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  content_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_lessons_module_order ON lessons (module_id, order_index);

CREATE TABLE learning_items (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (
    item_type IN ('word', 'phrase', 'collocation', 'phrasal_verb', 'functional_phrase', 'contrast')
  ),
  lemma TEXT NOT NULL,
  display_form TEXT NOT NULL,
  part_of_speech TEXT,
  level_id TEXT NOT NULL REFERENCES levels (id),
  frequency_band TEXT,
  difficulty INTEGER,
  is_core INTEGER NOT NULL DEFAULT 1,
  topic TEXT,
  subtopic TEXT,
  pronunciation_ipa TEXT,
  audio_key TEXT,
  -- Minimal provenance tracking (not a licensing registry): every Phase 5
  -- seed item is "original". See docs/curriculum.md.
  provenance TEXT NOT NULL DEFAULT 'original' CHECK (
    provenance IN ('original', 'derived_open_data')
  ),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  content_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_learning_items_level ON learning_items (level_id, status);

-- One localization row per (item, language) — the English item is never
-- duplicated per language; a future language is just a new row here.
CREATE TABLE learning_item_localizations (
  item_id TEXT NOT NULL REFERENCES learning_items (id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  translation TEXT NOT NULL,
  simple_explanation TEXT,
  usage_note TEXT,
  common_error_explanation TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  content_version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (item_id, language)
);

CREATE TABLE item_examples (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES learning_items (id) ON DELETE CASCADE,
  example_text TEXT NOT NULL,
  level_id TEXT REFERENCES levels (id),
  is_primary INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  content_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_item_examples_item ON item_examples (item_id);
-- At most one primary example per item.
CREATE UNIQUE INDEX idx_item_examples_one_primary ON item_examples (item_id) WHERE is_primary = 1;

CREATE TABLE item_patterns (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES learning_items (id) ON DELETE CASCADE,
  pattern_text TEXT NOT NULL,
  correct_example TEXT,
  incorrect_example TEXT,
  order_index INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_item_patterns_item ON item_patterns (item_id);

CREATE TABLE item_relations (
  from_item_id TEXT NOT NULL REFERENCES learning_items (id) ON DELETE CASCADE,
  to_item_id TEXT NOT NULL REFERENCES learning_items (id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (
    relation_type IN ('confused_with', 'word_family', 'synonym', 'antonym', 'related')
  ),
  PRIMARY KEY (from_item_id, to_item_id, relation_type)
);

CREATE TABLE grammar_patterns (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels (id),
  title TEXT NOT NULL,
  pattern_key TEXT NOT NULL UNIQUE,
  formula TEXT,
  explanation_en TEXT NOT NULL,
  difficulty INTEGER,
  order_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  content_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grammar_patterns_level ON grammar_patterns (level_id, status);

CREATE TABLE grammar_pattern_localizations (
  grammar_pattern_id TEXT NOT NULL REFERENCES grammar_patterns (id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  explanation TEXT NOT NULL,
  usage_note TEXT,
  common_mistake TEXT,
  PRIMARY KEY (grammar_pattern_id, language)
);

CREATE TABLE grammar_relations (
  from_pattern_id TEXT NOT NULL REFERENCES grammar_patterns (id) ON DELETE CASCADE,
  to_pattern_id TEXT NOT NULL REFERENCES grammar_patterns (id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (
    relation_type IN ('prerequisite', 'confused_with', 'related')
  ),
  PRIMARY KEY (from_pattern_id, to_pattern_id, relation_type)
);

CREATE TABLE lesson_items (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('learning_item', 'grammar_pattern')),
  content_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('introduce', 'practice', 'review', 'target')),
  order_index INTEGER NOT NULL,
  required INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX idx_lesson_items_order ON lesson_items (lesson_id, order_index);
