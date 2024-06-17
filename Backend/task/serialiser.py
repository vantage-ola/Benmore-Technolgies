from rest_framework import serializers
from .models import Task

class TaskSerialiser(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'



class ValidateTaskSerializer(serializers.ModelSerializer):

    class Meta:
        model = Task
        fields = []

    def validate(self, attrs):
        data = attrs.copy()

        tid = self.context.get("tid")
        from .services import TaskService
        task_service = TaskService(None)
        task, error = task_service.fetch_single_by_task_id(task_id=tid)

        if error:
            raise serializers.ValidationError(error, "task_id")
        
        data["task"] = task

        return data
    

class UpdateTaskSerializer(ValidateTaskSerializer):

    class Meta:
        model = Task
        fields = ["name", "due_date", "description", "status", "priority"]