
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TaskItem from "./TaskItem";
import { CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "./i18n/LanguageContext";

export default function TaskList({ tasks, onToggleComplete, onReorderTasks, onUpdateTask }) {
  const { t } = useLanguage();
  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    onReorderTasks(sourceIndex, destinationIndex);
  };

  return (
    <div className="space-y-6">
      {/* 未完成任务 */}
      <div>
        {incompleteTasks.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              {t('taskList.pending')} ({incompleteTasks.length})
            </h2>
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3"
              >
                <AnimatePresence>
                  {incompleteTasks.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id.toString()}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging
                              ? provided.draggableProps.style?.transform
                              : "none",
                          }}
                        >
                          <TaskItem
                            task={task}
                            onToggleComplete={onToggleComplete}
                            onUpdateTask={onUpdateTask}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </AnimatePresence>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {incompleteTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">{t('taskList.allDone')}</h3>
            <p className="text-slate-500">{t('taskList.allDoneDesc')}</p>
          </motion.div>
        )}
      </div>

      {/* 已完成任务 */}
      {completedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              {t('taskList.completed')} ({completedTasks.length})
            </h2>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onUpdateTask={onUpdateTask}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
