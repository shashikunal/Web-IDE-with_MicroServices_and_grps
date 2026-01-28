export default {
  id: 'django',
  name: 'Django',
  type: 'framework',
  image: 'python:3.11-alpine',
  language: 'python',
  compiler: null,
  interpreter: 'python3',
  runtime: 'python',
  entrypoint: ['sh'],
  cmd: ['-c', 'pip install django && python manage.py runserver 0.0.0.0:8000'],
  port: 8000,
  startCommand: 'python manage.py runserver 0.0.0.0:8000',
  files: {
    'manage.py': `#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()`,
    'myproject/__init__.py': '',
    'myproject/settings.py': `from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-test-key-do-not-use-in-production'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'myapp',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myproject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'myproject.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

X_FRAME_OPTIONS = 'ALLOWALL'`,
    'myproject/urls.py': `from django.contrib import admin
from django.urls import path
from myapp import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
]`,
    'myproject/wsgi.py': `import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

application = get_wsgi_application()`,
    'myapp/__init__.py': '',
    'myapp/admin.py': 'from django.contrib import admin\n# Register your models here.',
    'myapp/apps.py': `from django.apps import AppConfig

class MyAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'myapp'`,
    'myapp/models.py': 'from django.db import models\n# Create your models here.',
    'myapp/tests.py': 'from django.test import TestCase\n# Create your tests here.',
    'myapp/views.py': `from django.http import JsonResponse
from django.utils import timezone

def home(request):
    return JsonResponse({
        'message': 'Welcome to Django!',
        'status': 'running',
        'framework': 'Django',
        'timestamp': timezone.now().isoformat()
    })`,
    'myapp/migrations/__init__.py': '',
    'requirements.txt': 'django>=5.0.0',
    'README.md': `# Django Starter

A simple Django boilerplate.
    
## Run
\`\`\`bash
python manage.py runserver 0.0.0.0:8000
\`\`\`
`
  },
  setupScript: 'pip install -r requirements.txt && python manage.py migrate'
};
