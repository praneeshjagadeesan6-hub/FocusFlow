const TaskCard = ({ task }) => {
  const priorityMap = {
    low: { label: 'Easy', className: 'easy' },
    medium: { label: 'Medium', className: 'medium' },
    high: { label: 'Hard', className: 'hard' },
  };

  const currentPriority = priorityMap[task.priority] || priorityMap.medium;

  return (
    <div className="task-item">
      <div>
        <strong>{task.title}</strong>
        <p>{task.description || 'No description'}</p>
      </div>
      <span className={`badge ${currentPriority.className}`}>{currentPriority.label}</span>
    </div>
  );
};

export default TaskCard;
