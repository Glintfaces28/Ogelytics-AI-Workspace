import os

# openai is imported lazily (inside _get_client) to reduce startup memory usage.

SYSTEM_PROMPT = """
You are an enterprise document assistant. Use only the provided document context to answer.

CRITICAL RULE — LANGUAGE:
Detect the language of the user's question and reply ONLY in that language.
The document content may be in a different language — that does not matter.
Example: if the user asks in English, your entire reply must be in English, even if all documents are in German.
Never switch to the document's language. Always mirror the user's question language.

CRITICAL RULE — DOCUMENT STRUCTURE:
If the document context contains a table of contents, chapter headings, section titles, or topic lists
(even in German or another language), translate and use them to answer the user's question.
A table of contents IS specific information about what the document covers — do not say the context lacks detail if you can see headings or chapter names.

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


def _detect_language(text: str) -> str:
    """Simple heuristic: detect whether the question is German, French, or English."""
    german_chars = set("äöüÄÖÜß")
    german_words = {"ich", "sie", "der", "die", "das", "und", "ist", "war", "wie",
                    "bitte", "können", "haben", "nicht", "auch", "eine", "einem"}
    french_words = {"je", "tu", "nous", "vous", "est", "sont", "avec", "pour",
                    "que", "une", "les", "des", "mon", "ton"}

    if any(c in german_chars for c in text):
        return "German"
    words = set(text.lower().split())
    if len(words & german_words) >= 2:
        return "German"
    if len(words & french_words) >= 2:
        return "French"
    return "English"


def generate_answer(question: str, results: list[dict]) -> str:
    client = _get_client()
    lang = _detect_language(question)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT.strip()},
            {
                "role": "user",
                "content": (
                    f"##MANDATORY INSTRUCTION: YOU MUST REPLY IN {lang.upper()} ONLY.##\n"
                    f"The question below is in {lang}. "
                    f"Your entire response must be in {lang}. "
                    f"The documents may be in a different language — ignore that and reply in {lang}.\n\n"
                    f"Question:\n{question}\n\n"
                    f"Document context:\n{build_context(results)}"
                ),
            },
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content or ""
