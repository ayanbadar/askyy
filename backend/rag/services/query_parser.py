from __future__ import annotations

import re

_ID_PATTERNS = (
    re.compile(r'\bINV-\d{4}-\d{4}\b', re.I),
    re.compile(r'\bINT-\d{4}\b', re.I),
    re.compile(r'\bCTR-\d{4}-\d{4}\b', re.I),
    re.compile(r'\bINSP-\d{4}-\d{4}\b', re.I),
    re.compile(r'\b(?:MAI|CUS)-\d{4}\b', re.I),
)

_RECORD_LABELS: dict[str, str] = {
    'contract': 'Contract',
    'contracts': 'Contract',
    'meeting': 'Meeting Notes',
    'meetings': 'Meeting Notes',
    'email': 'Internal Email',
    'emails': 'Internal Email',
    'ticket': 'Customer Support Ticket',
    'tickets': 'Customer Support Ticket',
    'field note': 'Field Note',
    'field notes': 'Field Note',
    'inspection': 'Inspection Report',
    'inspections': 'Inspection Report',
    'inspection report': 'Inspection Report',
    'maintenance': 'Maintenance Report',
    'maintenance report': 'Maintenance Report',
}

_TYPED_RECORD_PATTERN = re.compile(
    r'\b('
    r'Contract|Meeting Notes|Internal Email|Customer Support Ticket|'
    r'Field Note|Inspection Report|Maintenance Report'
    r')\s*#\s*(\d+)\b',
    re.I,
)

_TYPE_NUMBER_PATTERN = re.compile(
    r'\b('
    r'contract|contracts|meeting|meetings|email|emails|ticket|tickets|'
    r'field\s+notes?|inspection(?:\s+report)?s?|maintenance(?:\s+report)?s?'
    r')\s*(?:#?\s*)?(?:number\s*)?(\d{1,4})\b',
    re.I,
)

_STOP_WORDS = frozenset(
    {
        'a',
        'an',
        'the',
        'is',
        'are',
        'was',
        'were',
        'be',
        'been',
        'being',
        'have',
        'has',
        'had',
        'do',
        'does',
        'did',
        'will',
        'would',
        'could',
        'should',
        'may',
        'might',
        'must',
        'shall',
        'can',
        'need',
        'dare',
        'ought',
        'used',
        'to',
        'of',
        'in',
        'for',
        'on',
        'with',
        'at',
        'by',
        'from',
        'as',
        'into',
        'through',
        'during',
        'before',
        'after',
        'above',
        'below',
        'between',
        'under',
        'again',
        'further',
        'then',
        'once',
        'here',
        'there',
        'when',
        'where',
        'why',
        'how',
        'all',
        'each',
        'few',
        'more',
        'most',
        'other',
        'some',
        'such',
        'no',
        'nor',
        'not',
        'only',
        'own',
        'same',
        'so',
        'than',
        'too',
        'very',
        'just',
        'and',
        'but',
        'if',
        'or',
        'because',
        'until',
        'while',
        'about',
        'against',
        'what',
        'which',
        'who',
        'whom',
        'this',
        'that',
        'these',
        'those',
        'am',
        'i',
        'me',
        'my',
        'myself',
        'we',
        'our',
        'ours',
        'ourselves',
        'you',
        'your',
        'yours',
        'yourself',
        'he',
        'him',
        'his',
        'she',
        'her',
        'hers',
        'it',
        'its',
        'they',
        'them',
        'their',
        'theirs',
        'tell',
        'give',
        'show',
        'find',
        'get',
        'know',
        'please',
        'recent',
        'latest',
        'number',
    }
)


class QueryParserService:
    @staticmethod
    def _normalize_record_label(raw: str) -> str:
        key = re.sub(r'\s+', ' ', raw.strip().lower())
        return _RECORD_LABELS.get(key, raw.strip())

    @classmethod
    def _extract_typed_record_phrases(cls, query: str) -> list[str]:
        """Build canonical record headers, e.g. Contract #73."""
        phrases: list[str] = []

        for match in _TYPED_RECORD_PATTERN.finditer(query):
            label = cls._normalize_record_label(match.group(1))
            phrases.append(f'{label} #{match.group(2)}')

        for match in _TYPE_NUMBER_PATTERN.finditer(query):
            label = cls._normalize_record_label(match.group(1))
            phrases.append(f'{label} #{match.group(2)}')

        return phrases

    @classmethod
    def extract_search_terms(cls, query: str) -> list[str]:
        """Extract high-signal terms for keyword / phrase search."""
        terms: list[str] = []

        for pattern in _ID_PATTERNS:
            terms.extend(pattern.findall(query))

        terms.extend(cls._extract_typed_record_phrases(query))

        terms.extend(re.findall(r'"([^"]{2,})"', query))
        terms.extend(re.findall(r"'([^']{2,})'", query))

        seen: set[str] = set()
        unique: list[str] = []
        for term in terms:
            key = term.lower()
            if key not in seen:
                seen.add(key)
                unique.append(term)
        return unique

    @staticmethod
    def extract_plain_search_terms(query: str) -> list[str]:
        """Significant non-stop words for plain full-text search."""
        words = re.findall(r'[\w-]{3,}', query.lower())
        return [word for word in words if word not in _STOP_WORDS][:8]

    @staticmethod
    def chunk_matches_terms(content: str, terms: list[str]) -> bool:
        if not terms:
            return False
        lower = content.lower()
        return any(term.lower() in lower for term in terms)

    @staticmethod
    def query_term_overlap_score(content: str, terms: list[str]) -> float:
        if not terms:
            return 0.0
        lower = content.lower()
        hits = sum(1 for term in terms if term.lower() in lower)
        return hits / len(terms)

    @staticmethod
    def contextual_match_score(content: str, terms: list[str], query: str) -> float:
        """Boost chunks where extracted terms appear with surrounding detail."""
        if not terms:
            return 0.0

        lower = content.lower()
        query_lower = query.lower()
        score = 0.0

        for term in terms:
            idx = lower.find(term.lower())
            if idx < 0:
                continue
            score += 1.0
            trailing = content[idx : idx + 400]
            score += min(len(trailing.strip()), 300) / 300

        if 'amount' in query_lower and 'amount due' in lower:
            score += 0.5
        if 'invoice' in query_lower and 'invoice number' in lower:
            score += 0.25
        if 'meeting' in query_lower and 'meeting notes' in lower:
            score += 0.25
        if 'email' in query_lower and 'internal email' in lower:
            score += 0.25
        if 'contract' in query_lower and 'contract #' in lower:
            score += 0.25
        if 'ticket' in query_lower and 'customer support ticket' in lower:
            score += 0.25
        if 'inspection' in query_lower and 'inspection report' in lower:
            score += 0.25
        if 'maintenance' in query_lower and 'maintenance report' in lower:
            score += 0.25

        return score


query_parser_service = QueryParserService()
