OPENAI_CHAT_MODELS: list[tuple[str, str]] = [
    ('gpt-4o-mini', 'GPT-4o mini'),
    ('gpt-4o', 'GPT-4o'),
    ('gpt-4.1-mini', 'GPT-4.1 mini'),
    ('gpt-4.1', 'GPT-4.1'),
    ('o3-mini', 'o3 mini'),
]

OPENAI_CHAT_MODEL_IDS = frozenset(model_id for model_id, _ in OPENAI_CHAT_MODELS)

DEFAULT_OPENAI_CHAT_MODEL = 'gpt-4o-mini'
