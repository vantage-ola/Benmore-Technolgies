from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from rest_framework.generics import CreateAPIView, UpdateAPIView, RetrieveAPIView
from service.utils import CustomApiRequestUtil
from .services import TaskService
from rest_framework.permissions import IsAuthenticated
from .models import Task
from .serialiser import TaskSerialiser, UpdateTaskSerializer, ValidateTaskSerializer

class TaskApiView(CreateAPIView, UpdateAPIView, RetrieveAPIView, CustomApiRequestUtil):
    response_serializer = TaskSerialiser
    serializer_class = TaskSerialiser

    def post(self, request, *args, **kwargs):
        service = TaskService(request)

        self.extra_context_data = {"pid": kwargs.get("pid")}

        return self.process_request(request, service.create)
    
    def put(self, request, *args, **kwargs):
        self.serializer_class = UpdateTaskSerializer
        self.extra_context_data = {"tid": kwargs.get("tid")}

        service = TaskService(request)

        return self.process_request(request, service.update)
    
    def get(self, request, *args, **kwargs):
        self.response_serializer = None

        filter_params = self.get_request_filter_params(request)

        service = TaskService(request)
        tid = kwargs.get("tid")

        if tid:
            self.wrap_response_in_data_object = True
            self.response_serializer = TaskSerialiser

            return self.process_request(request, service.fetch_single_by_task_id, task_id=tid)

        return self.process_request(request, service.fetch_list, filter_params=filter_params)
    
    def delete(self, request, *args, **kwargs):
        self.serializer_class = ValidateTaskSerializer
        self.response_serializer = None

        service = TaskService(request)

        self.extra_context_data = {"tid": kwargs.get("tid")}

        return self.process_request(request, service.delete)
    

class TaskOptionsApiView(RetrieveAPIView, CustomApiRequestUtil):

    def get(self, request, *args, **kwargs):
        service = TaskService(request)
        response_data = service.fetch_options()

        return self.response_with_json(response_data)