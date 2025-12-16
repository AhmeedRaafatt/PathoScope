"""
URL configuration for pathoscope project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include  # Import 'include'
from django.conf import settings               # <--- 1. Import this
from django.conf.urls.static import static     # <--- 2. Import this

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')), # This adds your routes
    path('api/accounts/', include('accounts.urls')),
    path('api/patient-portal/', include('patient_portal.urls')),
    path('api/hematology/', include('hematology.urls')),
    # --- ADD THIS LINE ---
    path('api/pathology/', include('pathology.urls')),
]

# --- 3. ADD THIS BLOCK AT THE END ---
# Without this, you will ALWAYS get "File Not Found" for images!
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)