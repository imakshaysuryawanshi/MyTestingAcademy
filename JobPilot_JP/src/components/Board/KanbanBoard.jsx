import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useJobStore } from '../../hooks/useJobStore';
import { COLUMNS } from '../../utils/constants';
import KanbanColumn from './KanbanColumn';
import DragOverlayCard from './DragOverlayCard';

export default function KanbanBoard() {
  const { filteredJobs, updateJob } = useJobStore();
  const [activeJob, setActiveJob] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const job = filteredJobs.find((j) => j.id === active.id);
    setActiveJob(job);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find the status of the over target
    const isColumn = over.data.current?.type === 'Column';
    const overStatus = isColumn ? over.id : over.data.current?.job?.status;

    if (!overStatus) return;

    const activeJob = filteredJobs.find((j) => j.id === activeId);
    if (activeJob.status !== overStatus) {
      // Optimistically update
      // This is a complex DnD step. For MVP, we'll handle the actual drop in handleDragEnd
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveJob(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine target status
    const isColumn = over.data.current?.type === 'Column';
    const targetStatus = isColumn ? over.id : over.data.current?.job?.status;

    const job = filteredJobs.find((j) => j.id === activeId);
    
    if (job && targetStatus && job.status !== targetStatus) {
      await updateJob({ ...job, status: targetStatus });
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-6 overflow-x-auto pb-4 no-scrollbar items-start">
        {COLUMNS.map((col) => (
          <KanbanColumn key={col.id} column={col} />
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeJob ? <DragOverlayCard job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
