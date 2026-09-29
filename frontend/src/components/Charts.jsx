const Charts = ({ tasks = [] }) => {
  const totalTasks = Math.max(tasks.length, 1);
  const doneTasks = tasks.filter((task) => task.status === 'done').length;
  const todoTasks = tasks.filter((task) => task.status === 'todo').length;
  const progressTasks = tasks.filter((task) => task.status === 'in-progress').length;

  const segments = [
    { label: 'Done', value: doneTasks, color: '#34d399', percent: (doneTasks / totalTasks) * 100 },
    { label: 'In progress', value: progressTasks, color: '#fbbf24', percent: (progressTasks / totalTasks) * 100 },
    { label: 'Todo', value: todoTasks, color: '#60a5fa', percent: (todoTasks / totalTasks) * 100 },
  ];

  return (
    <div className="card chart-card">
      <h4>Progress Overview</h4>
      <div className="progress-overview-rings">
        {segments.map((segment) => {
          const radius = 34;
          const circumference = 2 * Math.PI * radius;
          const dashOffset = circumference - (segment.percent / 100) * circumference;

          return (
            <div key={segment.label} className="progress-ring-card">
              <div className="progress-ring-wrapper">
                <svg className="progress-ring" viewBox="0 0 100 100" aria-label={`${segment.label} progress`}>
                  <circle cx="50" cy="50" r={radius} className="progress-ring-bg" />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="progress-ring-fill"
                    style={{
                      stroke: segment.color,
                      strokeDasharray: circumference,
                      strokeDashoffset: dashOffset,
                    }}
                  />
                </svg>
                <div className="progress-ring-value">{Math.round(segment.percent)}%</div>
              </div>
              <div className="progress-ring-label">
                <span>{segment.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Charts;
