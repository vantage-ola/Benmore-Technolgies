from django.contrib import admin
from .models import Task

class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'priority', 'due_date', 'category', 'assigned_to', 'created_at')
    search_fields = ('title', 'description', 'category')
    list_filter = ('status', 'priority', 'assigned_to', 'created_at')

admin.site.register(Task, TaskAdmin)