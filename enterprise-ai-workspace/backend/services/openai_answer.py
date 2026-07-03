import os

# openai is imported lazily (inside _get_client) to reduce startup memory usage.

SYSTEM_PROMPT = """
You are an enterprise document assistant. Use only the provided document context to answer.
Always respond in the same language the user is writing in.
If the user writes in English, respond in English.
If the user writes in German, respond in German.
If the user writes in French, respond in French.
Automatically detect the user's language and match it.
If the context does not contain enough information, say so clearly in the user's language.
"""

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

_client = None  # singleton — created once on first AI request


def is_openai_configured() -> bool:
    return bool(OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here")


def _get_client():
    """Return a cached OpenAI client; import and create it lazily."""
    global _client
    if _client is None:
        from openai import OpenAI  # noqa: PLC0415 — intentional lazy import
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


def build_context(results: list[dict]) -> str:
    if not results:
        return "No document context was found."

    context_blocks = []
    for index, result in enumerate(results, start=1):
        context_blocks.append(
            "\n".join(
                [
                    f"Source {index}",
                    f"Document ID: {result['document_id']}",
                    f"Filename: {result['filename']}",
                    f"Chunk: {result['passage']}",
                ]
            )
        )
    return "\n\n".join(context_blocks)


def generate_answer(question: str, results: list[dict]) -> str:
    client = _get_client()
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT.strip()},
            {
                "role": "user",
                "content": (
                    f"Question:\n{question}\n\n"
                    f"Document context:\n{build_context(results)}"
                ),
            },
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content or ""
