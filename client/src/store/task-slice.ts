import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { taskApi, useGetAllTasksQuery } from "./fetures/task-api";
import { formatDate } from "../utils/Functions";
import { compareDates } from "../utils/Functions";
import { Task } from "../pages/Task";
import { useDispatch } from "react-redux";

interface overdueInterface {
  overdueLogic: boolean | any;
  overdueTaskCount: number | any;
}

export interface TasksState {
  totalTask: Task[];
  filteredTask: Task[];
  filterMessage: string;
  overdueTasks: Task[];
  taskPageNumber: number;
}

export interface filterTaskStaus {
  searchTerm: string;
  showCompleted: boolean;
  showNotCompleted: boolean;
}

const initialState: TasksState = {
  totalTask: [],
  filteredTask: [],
  filterMessage: "",
  overdueTasks: [],
  taskPageNumber: 1,
};



interface GetTasksRequest {
  userId: string;
  pageNumber: number;
}

export const fetchTask = createAsyncThunk<void, GetTasksRequest>(
  'tasks/fetchTask',
  async ({ userId, pageNumber }: GetTasksRequest) => {
    const { data } =  useGetAllTasksQuery({ userID: userId, pageNumber: pageNumber });
  }
);



const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    setTasks(state, action: PayloadAction<Task[]>) {
      state = {
        ...state,
        totalTask: action.payload,
      };
      return state;
    },
    setTaskPageNumber(state, action: PayloadAction<number>) {
      
      
      
      state = { ...state, taskPageNumber: action.payload };
      
      console.log("page number", state.taskPageNumber);
      return state;
    },

    filterTaskDueDate(state) {
      state = {
        ...state,
        filteredTask: state.totalTask.filter(
          (task) =>
            compareDates(task.date.split("T")[0], formatDate(new Date())) &&
            task.task_status === false
        ),
      };
      return state;
    },
    setFilterByStatus(state, action: PayloadAction<filterTaskStaus>) {
      state = {
        ...state,
        filteredTask: state.totalTask.filter(
          (task) =>
            task.task_description
              .toLowerCase()
              .includes(action.payload.searchTerm.toLowerCase()) &&
            ((action.payload.showCompleted && task.task_status) ||
              (action.payload.showNotCompleted && !task.task_status) ||
              (!action.payload.showCompleted &&
                !action.payload.showNotCompleted))
        ),
      };
      if (action.payload.showCompleted && action.payload.showNotCompleted) {
        state = {
          ...state,
          filterMessage: "Results for Both Completed & Not Completed Tasks",
        };
      } else if (action.payload.showNotCompleted) {
        state = {
          ...state,
          filterMessage: "Results for Not Completed Tasks",
        };
      } else if (action.payload.showCompleted) {
        state = {
          ...state,
          filterMessage: "Results for Completed Tasks",
        };
      } else {
        state = {
          ...state,
          filterMessage: "",
        };
      }

      return state;
    },

    setFilterByDate(
      state,
      action: PayloadAction<{
        date: { selection: { startDate: string; endDate: string } };
        searchTerm: string;
        showCompleted: boolean;
        showNotCompleted: boolean;
      }>
    ) {
      const { date, searchTerm, showCompleted, showNotCompleted } =
        action.payload;
      const filteredTasks = state.totalTask.filter((task) => {
        const taskDate = task.date?.split("T")[0];
        const withinRange =
          task.date?.split("T")[0] >=
            formatDate(new Date(date.selection.startDate)) &&
          taskDate <= formatDate(new Date(date.selection.endDate));
        const singleDay = taskDate.toDateString === date.selection.startDate;
        return (
          (withinRange || singleDay) &&
          task.task_description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) &&
          ((showCompleted && task.task_status) ||
            (showNotCompleted && !task.task_status) ||
            (!showCompleted && !showNotCompleted))
        );
      });
      const newStartDate = new Date(date.selection.startDate);
      const newEndDate = new Date(date.selection.endDate);
      newStartDate.setDate(newStartDate.getDate() + 1);
      newEndDate.setDate(newEndDate.getDate() + 1);
      state = {
        ...state,
        filteredTask: filteredTasks,
        filterMessage:
          filteredTasks.length > 0
            ? `Results for tasks between ${
                newStartDate.toISOString().split("T")[0]
              } and ${newEndDate.toISOString().split("T")[0]}`
            : "No tasks available for the selected date range",
      };

      return state;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      taskApi.endpoints.getAllTasks.matchFulfilled,
      (state, { payload }) => {
        console.log("extra reducer worked")
        state = {
          ...state,
          totalTask: payload.tasksToTheUser,
          overdueTasks: payload.tasksToTheUser.filter(
            (task) =>
              compareDates(
                task.date.split("T")[0].trim(),
                formatDate(new Date())
              ) && task.task_status === false
          ),
        };
        return state;
      }
    );
  },
});

export const taskActions = taskSlice.actions;
export default taskSlice;
