from django.urls import path

from task.views import TaskApiView, TaskOptionsApiView


urlpatterns = [
    path('', TaskApiView.as_view()),
    path('options', TaskOptionsApiView.as_view()),
    path('project/<str:pid>', TaskApiView.as_view()),
    path('<str:tid>', TaskApiView.as_view()),
]