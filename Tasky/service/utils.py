from rest_framework.pagination import PageNumberPagination
from rest_framework import status
import random
from datetime import datetime
from math import ceil
from rest_framework.response import Response

class Pagination(PageNumberPagination):
    max_page_size = 100
    page_size = 15
    page_query_param = "page"
    page_size_query_param = 'page_size'

class CustomApiRequestUtil(Pagination):
    serializer_class = None
    response_serializer = None
    wrap_response_in_data_object = None
    context = None
    extra_context_data = None
    response_serializer_requires_many = None
    current_page = 1

    def __init__(self, request):
        self.request = request

    def log_error(self, error):
        #log or send to admin email, etc
        print(error)

    def make_error(self, error=None, message="Internal Server Error", status_code=500):
        self.status_code = status_code
        if error:
            self.log_error(error)
        return message, status_code
    
    
    def get_request_filter_params(self, *additional_params):
        if additional_params is None:
            additional_params = []

        data = {}

        filter_bucket = self.request.query_params

        general_params = ['keyword', 'filter', 'from_date', 'to_date', 'page', 'page_size', 'status'] + list(
            additional_params)

        for param in general_params:
            field_value = filter_bucket.get(param, None)

            if field_value is not None:
                if str(field_value).lower() in ['true', 'false']:
                    data[param] = str(filter_bucket.get(param))
                else:
                    data[param] = filter_bucket.get(param) or ''
            else:
                data[param] = None

        if data['filter'] and not data['keyword']:
            data['keyword'] = data['filter']

        try:
            data['page'] = int(data.get('page') or 1)

        except Exception as e:
            data['page'] = 1
            self.make_error(error=e)

        try:
            data['page_size'] = int(data.get('page_size') or 100)

        except Exception as e:
            data['page_size'] = 100
            self.make_error(error=e)

        self.current_page = data.get("page")
        self.page_size = data.get("page_size")

        return data
    
    def get_paginated_list_response(self, data, count_all):
        return self.__make_pages(self.__get_pagination_data(count_all, data))
    
    def __make_pages(self, pagination_data):
        prev_page_no, data, total, last_page, has_next_page, has_prev_page = pagination_data

        prev_page_url = None
        next_page_url = None

        request_url = self.request.path

        q_list = []
        if has_next_page or has_prev_page:
            query_list = self.request.query_params or {}
            for key in query_list:
                if key != "page":
                    q_list.append(f"{key}={query_list[key]}")

        if has_next_page:
            new_list = q_list.copy()
            new_list.append("page=" + str((+self.current_page + 1)))
            q = "&".join(new_list)
            next_page_url = f"{request_url}?{q}"

        if has_prev_page:
            new_list = q_list.copy()
            new_list.append("page=" + str((+self.current_page - 1)))
            q = "&".join(new_list)
            prev_page_url = f"{request_url}?{q}"

        return {
            "page_size": self.page_size,
            "current_page": self.current_page if self.current_page <= last_page else last_page,
            "last_page": last_page,
            "total": total,
            "next_page_url": next_page_url,
            "prev_page_url": prev_page_url,
            "data": data
        }
    
    def __get_pagination_data(self, total, data):
        prev_page_no = int(self.current_page) - 1
        last_page = ceil(total / self.page_size) if self.page_size > 0 else 0
        has_next_page = total > 0 and len(data) > 0 and total > ((self.page_size * prev_page_no) + len(data))
        has_previous_page = (prev_page_no > 0) and (total >= (self.page_size * prev_page_no))

        return prev_page_no, data, total, last_page, has_next_page, has_previous_page

    def process_request(self, request, target_function, **extra_args):
        if not self.context:
            self.context = dict()
            
        self.context['request'] = request

        if self.extra_context_data:
            for key, val in self.extra_context_data.items():
                self.context[key] = val

        if self.serializer_class and request.method in {"PUT", "POST", "DELETE"}:
            serializer = self.serializer_class(data=request.data, context=self.context)

            if serializer.is_valid():
                response_raw_data = target_function(serializer.validated_data, **extra_args)
                return self.__handle_request_response(response_raw_data)
            
            else:
                return self.validation_error(serializer.errors)
        else:
            response_raw_data = target_function(**extra_args)
            return self.__handle_request_response(response_raw_data)
        
    def response_with_json(self, data, status_code=None):
        if not status_code:
            status_code = status.HTTP_200_OK

        if not data:
            data = {}
        elif not isinstance(data, dict):
            data = {"data": data}

        return Response(data, status=status_code)
    
    def validation_error(self, errors, status_code=None):
        if status_code is None:
            status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

        if isinstance(errors, dict) and 'error' in errors:
            nested_errors = errors.pop("error")
            errors.pop("status_code", None)

            for key, value in nested_errors.items():
                errors.update({key: [value]})

        return self.response_with_json({
            "errors": errors
        }, status_code=status_code)
    
    def response_with_error(self, error, status_code=None):
        if not status_code:
            status_code = status.HTTP_400_BAD_REQUEST

        message = {
            "message": error
        }

        return self.response_with_json(message, status_code=status_code)
        
    def __handle_request_response(self, response_raw_data):
        response_data, error_detail = None, None

        if isinstance(response_raw_data, tuple):
            response_data, error_detail = response_raw_data
        else:
            response_data = response_raw_data

        if error_detail:
            message = error_detail[0]
            status_code = error_detail[1]
            return self.response_with_error(message, status_code)

        if self.response_serializer is not None:
            response_data = self.response_serializer(response_data, many=self.response_serializer_requires_many).data

        if self.wrap_response_in_data_object:
            response_data = {"data": response_data}

        return self.response_with_json(response_data)

def generate_id(prefix="", length=5):
    rand_no = ""
    for i in range(0, length):
        rand_no += random.choice("0123456789")

    date_to_string = (
            datetime.strftime(datetime.now(), "%Y%m%d%H%M%S") +
            rand_no
    )

    return f'{prefix}-{date_to_string}'