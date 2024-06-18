
$(document).ready(function() {
    const baseUrl = "http://127.0.0.1:8000/api/tasks/";

    const projectListContainer = document.getElementById('project-list-container');
    const upcomingTaskListContainer = document.getElementById('upcoming-task-list-container');
    const closeProjectCreateButton = $('#closeCreateProject');
    const closeTaskCreateButton = $('#closeCreateTask');


    const filterObjectToString = (filterObj) => {
        let filterString = '';
        for (const [key, value] of Object.entries(filterObj)) {
            filterString += `${key}=${value}&`;
        }
        return filterString.trim();
    };

    const fetchProjects = async(filterParams) => {
        projectListContainer.innerHTML = '';
        const projects = await makeRequest({
            endpoint: "/projects/",
            type: "GET"
        })

        for (let project of projects.data){
            arrangeProjectItem({project})
        }
    }

    const fetchTasks = async({filterParams}) => {
        let endpoint = "/tasks"

        if (filterParams){
            endpoint += `?${filterObjectToString(filterParams)}`
        }

        const tasks = await makeRequest({
            endpoint,
            type: "GET"
        })

        return tasks
    }

    const fetchUpcomingTask = async() => {
        upcomingTaskListContainer.innerHTML = ''
        let filterParams = {
            status: "Ongoing",
            page_size: 4
        }
        const tasks = await fetchTasks({
            filterParams
        })

        for (let task of tasks.data){
            arrangeUpcomingTaskItems({task})
        }
    }

    const makeRequest = ({endpoint, type, data}) => {
        let url = baseUrl + endpoint

        return new Promise((resolve, reject) => {
            $.ajax({
                url,
                type,
                data,
                success: function(response) {
                    resolve(response);
                },
                error: function(xhr, status, error) {
                    if (xhr.status === 422){
                        error = xhr.responseJSON.errors.non_field_errors[0]
                        showMessage({
                            title: error
                        })
                    }
                    showMessage({
                        title: error,
                    })
                }
            });
        })
    }

    // Function to show modal with dynamic content
    function showMessage({title, icon}) {
        const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            }
        });

        Toast.fire({
        icon: icon || "error",
        title: title || "An error occurred!"
        });
    }
    
    $('#createProjectForm').submit(async function(e) {
        e.preventDefault(); 
        
        // Retrieve input values
        const name = $('#name').val();
        const due_date = $('#due_date').val();
        const description = $('#description').val();
        const func = $('#function').val();
        const pid = $('#project_id').val();
        
        closeModal()

        let endpoint = '/projects/'
        let type = 'POST'

        if (func == 'update'){
            endpoint += `${pid}`
            type = 'PUT'
        }

        if (name.trim() === ''){
            showMessage({
                title: "Project name is required",
            })
            return;
        }

        const project = await makeRequest({
            endpoint,
            type,
            data: {
                name: name,
                due_date: due_date,
                description: description
            }
        })
        showMessage({
            title: "Success",
            icon: "success"
        })
        fetchProjects()
    });

    $('#createTaskForm').submit(async function(e) {
        e.preventDefault(); 
        
        // Retrieve input values
        const name = $('#task_name').val();
        const due_date = $('#task_due_date').val();
        const description = $('#task_description').val();
        const func = $('#task_function').val();
        const pid = $('#task_project_id').val();
        const tid = $('#task_id').val();
        
        closeTaskModal()

        let endpoint = '/tasks/'
        let type = 'POST'

        if (func == 'update'){
            endpoint += `${tid}`
            type = 'PUT'
        } else{
            endpoint += `project/${pid}`
        }

        if (name.trim() === ''){
            showMessage({
                title: "Task name is required",
            })
            return;
        }

        const task = await makeRequest({
            endpoint,
            type,
            data: {
                name: name,
                due_date: due_date,
                description: description
            }
        })
        showMessage({
            title: "Success",
            icon: "success"
        })

        fetchProjects();
        fetchUpcomingTask();

    });

    const arrangeProjectItem = ({project}) => {
        const pid = project.project_id
        const name = project.name
        const createdAt = dateCreatedFormatter(project.created_at)
        const dueIn = dueDateFormatter(project.due_date)

        const completedTasks = project.completed_tasks
        const totalTasks = project.total_tasks

        let status = project.status
        let progressColor = "blue-progress"
        const progressBarCalculator = completedTasks / totalTasks * 100

        if(totalTasks == completedTasks){
            status = "Completed"
            progressColor = "green-progress"
        }

        const newProjectItem = document.createElement('div');
        newProjectItem.classList.add('w-full', 'flex', 'flex-row', 'items-center', 'gap-12', 'px-4', 'py-6', 'shadow-md', 'rounded-2xl');

        // Project Image and Name section
        let projectImageDiv = document.createElement('div');
        projectImageDiv.classList.add('flex', 'flex-row', 'gap-3', 'items-center', 'w-2/5', 'pl-12');
        let projectImage = document.createElement('img');
        projectImage.src = 'static/images/profile-2.jpg';
        projectImage.classList.add('w-8', 'h-8', 'rounded-full');
        let projectNameDiv = document.createElement('div');
        projectNameDiv.classList.add('flex', 'flex-col');
        let projectName = document.createElement('p');
        projectName.classList.add('font-bold', 'text-faint-black');
        projectName.textContent = name;
        let dateOfCreation = document.createElement('p');
        dateOfCreation.classList.add('font-normal', 'text-gray-400', 'text-sm');
        dateOfCreation.textContent = createdAt;
        projectNameDiv.appendChild(projectName);
        projectNameDiv.appendChild(dateOfCreation);
        projectImageDiv.appendChild(projectImage);
        projectImageDiv.appendChild(projectNameDiv);

        // Time Duration section
        let timeDurationDiv = document.createElement('div');
        timeDurationDiv.classList.add('w-1/5');
        let timeDuration = document.createElement('p');
        timeDuration.classList.add('py-3', 'bg-faint-gray', 'text-center', 'rounded-md');
        timeDuration.textContent = dueIn;
        timeDurationDiv.appendChild(timeDuration);

        // Completed Tasks section
        let completedTasksDiv = document.createElement('div');
        completedTasksDiv.classList.add('w-1/5', 'pl-8');
        let completedTasksLabel = document.createElement('p');
        completedTasksLabel.classList.add('font-semibold');
        completedTasksLabel.textContent = `${completedTasks} / ${totalTasks}`;
        let totalTasksLabel = document.createElement('p');
        totalTasksLabel.classList.add('font-normal', 'text-gray-400', 'text-sm');
        totalTasksLabel.textContent = 'Tasks';
        completedTasksDiv.appendChild(completedTasksLabel);
        completedTasksDiv.appendChild(totalTasksLabel);

        // Progress section
        let progressDiv = document.createElement('div');
        progressDiv.classList.add('w-1/5', 'flex', 'flex-col', 'gap-2', 'font-light', `text-${progressColor}`);
        let progressIcon = document.createElement('i');
        progressIcon.classList.add('material-symbols-outlined');
        progressIcon.textContent = 'list';
        let progressLabel = document.createElement('p');
        progressLabel.classList.add('flex', 'items-center', 'gap-1');
        progressLabel.appendChild(progressIcon);

        let progressText = document.createTextNode(status);
        progressLabel.appendChild(progressText);

        // Progress Bar
        let progressBarDiv = document.createElement('div');
        progressBarDiv.classList.add('w-full', 'bg-gray-200', 'rounded-lg', 'overflow-hidden');
        let progressBar = document.createElement('div');
        progressBar.classList.add('h-1', `bg-${progressColor}`);
        progressBarDiv.appendChild(progressBar);
        progressDiv.appendChild(progressLabel);
        progressDiv.appendChild(progressBarDiv);

        // Members section
        let membersDiv = document.createElement('div');
        membersDiv.classList.add('w-1/5');
        let membersContainer = document.createElement('div');
        membersContainer.classList.add('flex', 'flex-row', 'ml-6');
        let memberImage1 = document.createElement('img');
        memberImage1.src = 'static/images/profile-1.jpg';
        memberImage1.classList.add('w-8', 'h-8', 'rounded-full');
        let memberImage2 = document.createElement('img');
        memberImage2.src = 'static/images/profile-2.jpg';
        memberImage2.classList.add('w-8', 'h-8', 'rounded-full', '-ml-2');
        let memberBadge = document.createElement('p');
        memberBadge.classList.add('w-8', 'h-8', 'rounded-full', '-ml-2', 'bg-faint-purple', 'text-center', 'flex', 'items-center', 'justify-center', 'font-light', 'text-sm');
        memberBadge.textContent = '+3';
        membersContainer.appendChild(memberImage1);
        membersContainer.appendChild(memberImage2);
        membersContainer.appendChild(memberBadge);
        membersDiv.appendChild(membersContainer);

        // More Options section
        let moreOptionsDiv = document.createElement('div');
        moreOptionsDiv.classList.add('text-faint-black', 'hover:cursor-pointer');
        let moreOptionsIcon = document.createElement('i');
        moreOptionsIcon.classList.add('material-symbols-outlined');
        moreOptionsIcon.textContent = 'more_vert';
        moreOptionsDiv.appendChild(moreOptionsIcon);

        let dropdownMenuHTML = `
            <div class="absolute right-0 z-10 hidden mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 
            focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="menu_button_${pid}" tabindex="-1" id="menu_button_${pid}">
                <div class="py-1" role="none">
                    <a href="#" class="text-gray-700 block px-4 py-2 text-sm edit-menu-item" role="menuitem" tabindex="-1" id="edit-menu-item-${pid}" data-project='${JSON.stringify(project)}'>Edit</a>
                    <a href="#" class="text-gray-700 block px-4 py-2 text-sm add-task-menu-item" role="menuitem" tabindex="-1" id="add-task-menu-item-${pid}" data-project='${JSON.stringify(project)}'">Add Task</a>
                    <a href="#" class="text-gray-700 block px-4 py-2 text-sm delete-menu-item" role="menuitem" tabindex="-1" id="delete-menu-item-${pid}" data-project='${JSON.stringify(project)}'>Delete</a>
                </div>
            </div>
            `;
        
        moreOptionsDiv.insertAdjacentHTML('beforeend', dropdownMenuHTML);

        // Add click event listener to the icon
        moreOptionsIcon.addEventListener('click', function() {
            let dialog = document.getElementById(`menu_button_${pid}`);

            dialog.classList.toggle('hidden');
        });

        // Append all sections to the new project item
        newProjectItem.appendChild(projectImageDiv);
        newProjectItem.appendChild(timeDurationDiv);
        newProjectItem.appendChild(completedTasksDiv);
        newProjectItem.appendChild(progressDiv);
        newProjectItem.appendChild(membersDiv);
        newProjectItem.appendChild(moreOptionsDiv);

        projectListContainer.appendChild(newProjectItem);
    }

    const arrangeUpcomingTaskItems = ({task}) => {
        const name = task.name
        const dueIn = dueDateFormatter(task.due_date)

        // Create the task list item container
        let taskListItem = document.createElement('div');
        taskListItem.classList.add('bg-white', 'text-gray-400', 'flex', 'flex-col', 'shadow-lg', 'p-3', 'rounded-lg', 'pb-4', 'mt-3');

        // First row: Task name and priority
        let firstRow = document.createElement('div');
        firstRow.classList.add('flex', 'flex-row', 'justify-between', 'items-center');

        let taskName = document.createElement('p');
        taskName.classList.add('font-bold', 'text-md');
        taskName.textContent = name;

        let priorityContainer = document.createElement('div');
        priorityContainer.classList.add('flex', 'flex-row');

        let priorityBadge = document.createElement('p');
        priorityBadge.classList.add('rounded-full', 'px-3', 'py-1', 'text-sm', 'bg-[#fdf7d5]', 'text-[#ece3a2]');
        priorityBadge.textContent = 'Urgent';

        let moreOptionsIconContainer = document.createElement('div');
        moreOptionsIconContainer.classList.add('text-faint-black', 'hover:cursor-pointer', 'text-xs');

        let moreOptionsIcon = document.createElement('i');
        moreOptionsIcon.classList.add('material-symbols-outlined');
        moreOptionsIcon.textContent = 'more_vert';

        moreOptionsIconContainer.appendChild(moreOptionsIcon);
        priorityContainer.appendChild(priorityBadge);
        priorityContainer.appendChild(moreOptionsIconContainer);

        firstRow.appendChild(taskName);
        firstRow.appendChild(priorityContainer);

        // Second row: Member images
        let secondRow = document.createElement('div');
        secondRow.classList.add('flex', 'flex-row', 'mt-1');

        let memberImage1 = document.createElement('img');
        memberImage1.src = 'static/images/profile-1.jpg';
        memberImage1.classList.add('w-6', 'h-6', 'rounded-full');

        let memberImage2 = document.createElement('img');
        memberImage2.src = 'static/images/profile-2.jpg';
        memberImage2.classList.add('w-6', 'h-6', 'rounded-full');

        secondRow.appendChild(memberImage1);
        secondRow.appendChild(memberImage2);

        // Third row: Progress bar and time
        let thirdRow = document.createElement('div');
        thirdRow.classList.add('flex', 'flex-row', 'mt-3', 'justify-between', 'items-center');

        let progressBarContainer = document.createElement('div');
        progressBarContainer.classList.add('flex', 'w-2/3', 'bg-gray-200', 'h-2', 'rounded-lg', 'overflow-hidden');

        let progressBar = document.createElement('div');
        progressBar.classList.add('bg-[#ece3a2]', 'h-2');
        progressBar.style.width = '61%';

        progressBarContainer.appendChild(progressBar);

        let timeContainer = document.createElement('div');
        timeContainer.classList.add('flex', 'items-center', 'text-xs', 'w-1/3', 'ml-4');

        let timeIcon = document.createElement('i');
        timeIcon.classList.add('material-symbols-outlined');
        timeIcon.style.fontSize = '1.2rem';
        timeIcon.textContent = 'schedule';

        let timeSpan = document.createElement('span');
        timeSpan.classList.add('ml-1');
        timeSpan.textContent = dueIn;

        timeContainer.appendChild(timeIcon);
        timeContainer.appendChild(timeSpan);

        thirdRow.appendChild(progressBarContainer);
        thirdRow.appendChild(timeContainer);

        // Fourth row: Task management
        let fourthRow = document.createElement('p');
        fourthRow.classList.add('text-sm', 'mt-2');
        fourthRow.textContent = task.description;

        // Append all rows to the task list item container
        taskListItem.appendChild(firstRow);
        taskListItem.appendChild(secondRow);
        taskListItem.appendChild(thirdRow);
        taskListItem.appendChild(fourthRow);

        // Append task list item to the project list container
        upcomingTaskListContainer.appendChild(taskListItem);
    }

    closeProjectCreateButton.click(function(e) {
        e.preventDefault();
        closeModal()
    });

    function closeModal() {
        $('#name').val('');
        $('#due_date').val('');
        $('#description').val('');
        $('#function').val('create');
        $('#project_id').val('');

        const createProjectModal = document.getElementById("create_project_modal");
        createProjectModal.close()
    }   
    
    closeTaskCreateButton.click(function(e) {
        e.preventDefault();
        closeTaskModal()
    });

    function closeTaskModal() {
        $('#task_name').val('');
        $('#task_due_date').val('');
        $('#task_description').val('');
        $('#task_function').val('create');
        $('#task_project_id').val('');

        const createTaskModal = document.getElementById("create_task_modal");
        createTaskModal.close()
    }  

    fetchProjects()
    fetchUpcomingTask();


const deleteProject = async(project) => {
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger"
        },
        buttonsStyling: true
      });
      
      swalWithBootstrapButtons.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
            makeRequest({
                endpoint: `/projects/${project.project_id}`,
                type: 'DELETE'
            })
          swalWithBootstrapButtons.fire({
            title: "Deleted!",
            text: "Your file has been deleted.",
            icon: "success"
          });
        fetchProjects()
        } else if (
          /* Read more about handling dismissals below */
          result.dismiss === Swal.DismissReason.cancel
        ) {
          swalWithBootstrapButtons.fire({
            title: "Cancelled",
            text: "Your imaginary file is safe :)",
            icon: "error"
          });
        }
      });
}

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-menu-item')) {
            let projectData = JSON.parse(event.target.dataset.project);
            deleteProject(projectData);
        }
    });
    
    const addTask = (projectData) => {
        document.getElementById('task_project_id').value = projectData.project_id
        const createTaskModal = document.getElementById("create_task_modal");
        createTaskModal.showModal()
        fetchUpcomingTask();
    }
    
    
    function openEditDialog(project) {
        document.getElementById('name').value = project.name;
    
        let date = new Date(project.due_date);
        let formattedDate = date.toISOString().slice(0, 16);
        document.getElementById('due_date').value = formattedDate;
    
        document.getElementById('description').value = project.description;
        document.getElementById('function').value = "update"
        document.getElementById('project_id').value = project.project_id
    
        // Open the dialog
        const createProjectModal = document.getElementById("create_project_modal");
        createProjectModal.showModal();
    }
    
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-task-menu-item')) {
            let projectData = JSON.parse(event.target.dataset.project);
            addTask(projectData);
        }
    });
    
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('edit-menu-item')) {
            let projectData = JSON.parse(event.target.dataset.project);
            openEditDialog(projectData);
        }
    });


});





const dateCreatedFormatter = (dateString) => {
    let date = new Date(dateString);

    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Get month, day, and year
    let monthIndex = date.getMonth(); // Returns 0 for January, 1 for February, etc.
    let day = date.getDate();
    let year = date.getFullYear();

    let formattedDate = months[monthIndex] + " " + day + ", " + year;

    return formattedDate
}

const dueDateFormatter = (dateString) => {
    if (!dateString) return "-"

    let dueInDate = new Date(dateString);

    let currentDate = new Date();

    // Calculate the difference between the future date and the current date in milliseconds
    let difference = dueInDate.getTime() - currentDate.getTime();

    // Convert milliseconds to days, hours, and minutes
    let days = Math.floor(difference / (1000 * 60 * 60 * 24));
    let hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    let remainingTimeString = days + "d, " + hours + "h, " + minutes + "m";

    return remainingTimeString;

    
}