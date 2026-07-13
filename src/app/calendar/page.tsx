/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useCRM } from '../../context/CRMContext';
import CalendarView from '../../components/CalendarView';

export default function CalendarPage() {
  const { tasks, addTask, toggleTask, deleteTask } = useCRM();

  return (
    <CalendarView
      tasks={tasks}
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onDeleteTask={deleteTask}
    />
  );
}
