from django.http import JsonResponse
from django.utils import timezone

def home(request):
    return JsonResponse({
        'message': 'Welcome to Django!',
        'status': 'running',
        'framework': 'Django',
        'timestamp': timezone.now().isoformat()
    })