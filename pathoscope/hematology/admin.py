from django.contrib import admin
from .models import Sample, TestResult, TestAnalyte, InstrumentQueue, QCLog

admin.site.register(Sample)
admin.site.register(TestResult)
admin.site.register(TestAnalyte)
admin.site.register(InstrumentQueue)
admin.site.register(QCLog)