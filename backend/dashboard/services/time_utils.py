from __future__ import annotations

from datetime import date, datetime, timedelta

from django.utils import timezone

DAY_LABELS = ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')


class TimeUtilsService:
    @staticmethod
    def start_of_day(value: datetime) -> datetime:
        localized = timezone.localtime(value)
        return localized.replace(hour=0, minute=0, second=0, microsecond=0)

    @staticmethod
    def date_range(end: date, *, days: int) -> list[date]:
        start = end - timedelta(days=days - 1)
        return [start + timedelta(days=offset) for offset in range(days)]

    @staticmethod
    def day_label(value: date) -> str:
        return DAY_LABELS[value.weekday()]

    @staticmethod
    def percent_change(current: float, previous: float) -> float:
        if previous == 0:
            return round(100.0 if current > 0 else 0.0, 1)
        return round(((current - previous) / previous) * 100, 1)

    @staticmethod
    def format_time_ago(value: datetime) -> str:
        now = timezone.now()
        if timezone.is_naive(value):
            value = timezone.make_aware(value, timezone.get_current_timezone())

        delta = now - value
        seconds = int(delta.total_seconds())

        if seconds < 60:
            return 'Just now'
        if seconds < 3600:
            minutes = max(1, seconds // 60)
            return f'{minutes} min ago' if minutes == 1 else f'{minutes} min ago'
        if seconds < 86400:
            hours = max(1, seconds // 3600)
            return f'{hours} hr ago' if hours == 1 else f'{hours} hr ago'
        if seconds < 172_800:
            return 'Yesterday'
        days = max(1, seconds // 86400)
        if days < 7:
            return f'{days} days ago'
        if days < 30:
            weeks = max(1, days // 7)
            return f'{weeks} week ago' if weeks == 1 else f'{weeks} weeks ago'
        months = max(1, days // 30)
        return f'{months} month ago' if months == 1 else f'{months} months ago'


time_utils_service = TimeUtilsService()
