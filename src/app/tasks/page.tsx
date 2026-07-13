/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useCRM } from '../../context/CRMContext';
import TasksView from '../../components/TasksView';

export default function TasksPage() {
  const { tasks, addTask, toggleTask, deleteTask, importTasks } = useCRM();

  return (
    <TasksView
      tasks={tasks}
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onDeleteTask={deleteTask}
      onImportTasks={importTasks}
    />
  );
}
