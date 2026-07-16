import os

# openai is imported lazily (inside _get_client) to reduce startup memory usage.

SYSTEM_PROMPT = """
You are an enterprise document assistant. Use only the provided document context to answer.

CRITICAL RULE — LANGUAGE:
Detect the language of the user's question and reply ONLY in that language.
The document content may be in a different language — that does not matter.
Example: if the user asks in English, your entire reply must be in English, even if all documents are in German.
Never switch to the document's language. Always mirror the user's question language.

If the context does not contain enough information to answer fully, say so clearly in the user's language.
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
                    f"IMPORTANT: My question below is written in a specific language. "
                    f"You MUST reply in that same language — even if the document context is in a different language. "
                    f"Do NOT respond in German unless my question is in German.\n\n"
                    f"Question:\n{question}\n\n"
                    f"Document context:\n{build_context(results)}"
                ),
            },
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content or ""
