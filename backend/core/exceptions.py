from rest_framework.views import exception_handler


def _extract_message(data) -> str | None:
    if not isinstance(data, dict):
        return str(data) if data is not None else None

    detail = data.get('detail')
    if detail is not None:
        if isinstance(detail, list):
            return ' '.join(str(item) for item in detail)
        return str(detail)

    messages: list[str] = []
    for value in data.values():
        if isinstance(value, list):
            messages.extend(str(item) for item in value)
        else:
            messages.append(str(value))

    return ' '.join(messages) if messages else None


def custom_exception_handler(exc, context):
    """Normalize API errors to `{ "message": "..." }` for the frontend."""
    response = exception_handler(exc, context)

    if response is None:
        return response

    message = _extract_message(response.data)
    if message:
        response.data = {'message': message}

    return response
