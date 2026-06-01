from django.core.management.base import BaseCommand

from sources.tasks import sync_all_google_drive_connections


class Command(BaseCommand):
    help = 'Sync all Google Drive connections with selected folders.'

    def handle(self, *args, **options):
        result = sync_all_google_drive_connections()
        self.stdout.write(self.style.SUCCESS(str(result)))
