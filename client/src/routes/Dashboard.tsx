import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  group: string;
  assignedTo: string[];
  status: 'pending' | 'in-progress' | 'completed';
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Review Q4 Report',
      description: 'Review and provide feedback on the quarterly report',
      dueDate: '2024-12-20',
      group: 'Marketing',
      assignedTo: ['You'],
      status: 'pending',
    },
    {
      id: '2',
      title: 'Team Meeting Prep',
      description: 'Prepare agenda for weekly team meeting',
      dueDate: '2024-12-18',
      group: 'Engineering',
      assignedTo: ['You', 'John'],
      status: 'in-progress',
    },
    {
      id: '3',
      title: 'Update Documentation',
      description: 'Update API documentation with new endpoints',
      dueDate: '2024-12-22',
      group: 'Engineering',
      assignedTo: ['You'],
      status: 'pending',
    },
  ]);

  const [groups, setGroups] = useState<Group[]>([
    { id: '1', name: 'Engineering', memberCount: 8 },
    { id: '2', name: 'Marketing', memberCount: 5 },
    { id: '3', name: 'Design', memberCount: 4 },
  ]);

  const handleTaskStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusClasses = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-purple-200 px-8 py-4">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Remindly</h1>
          <div className="flex gap-2">
            <button className="w-9 h-9 border-none bg-transparent rounded-md cursor-pointer text-xl flex items-center justify-center hover:bg-slate-50 transition-colors">
              🔔
            </button>
            <button className="w-9 h-9 border-none bg-transparent rounded-md cursor-pointer text-xl flex items-center justify-center hover:bg-slate-50 transition-colors">
              👤
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-8">
        <aside className="w-60 py-8 pr-8 border-r border-purple-200 flex flex-col gap-8">
          <nav className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-4 py-3 border-none bg-slate-50 text-left cursor-pointer rounded-md text-primary font-medium text-base transition-colors">
              <span className="text-xl">📋</span>
              <span>Tasks</span>
            </button>
            <button className="flex items-center gap-3 px-4 py-3 border-none bg-transparent text-left cursor-pointer rounded-md text-indigo-600 text-base hover:bg-slate-50 transition-colors">
              <span className="text-xl">👥</span>
              <span>Groups</span>
            </button>
            <button className="flex items-center gap-3 px-4 py-3 border-none bg-transparent text-left cursor-pointer rounded-md text-indigo-600 text-base hover:bg-slate-50 transition-colors">
              <span className="text-xl">📅</span>
              <span>Calendar</span>
            </button>
            <button className="flex items-center gap-3 px-4 py-3 border-none bg-transparent text-left cursor-pointer rounded-md text-indigo-600 text-base hover:bg-slate-50 transition-colors">
              <span className="text-xl">⚙️</span>
              <span>Settings</span>
            </button>
          </nav>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-600 px-4 mb-2">
              Groups
            </h3>
            {groups.map(group => (
              <div
                key={group.id}
                className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="flex-1 text-base text-slate-900">{group.name}</span>
                <span className="text-sm text-indigo-600">{group.memberCount}</span>
              </div>
            ))}
            <button className="mt-2 px-4 py-2 border-none bg-transparent text-primary text-base font-medium cursor-pointer rounded-md text-left hover:bg-slate-50 transition-colors">
              + New Group
            </button>
          </div>
        </aside>

        <main className="flex-1 py-8 pl-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">My Tasks</h2>
            <button className="py-2.5 px-5 rounded-md text-base font-medium bg-primary text-white hover:bg-[#7c3aed] transition-colors">
              + New Task
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex gap-2 border-b border-purple-200 pb-3">
              <button className="px-4 py-2 border-none bg-slate-50 text-primary text-base font-medium cursor-pointer rounded-md transition-colors">
                All
              </button>
              <button className="px-4 py-2 border-none bg-transparent text-indigo-600 text-base font-medium cursor-pointer rounded-md hover:bg-slate-50 transition-colors">
                Pending
              </button>
              <button className="px-4 py-2 border-none bg-transparent text-indigo-600 text-base font-medium cursor-pointer rounded-md hover:bg-slate-50 transition-colors">
                In Progress
              </button>
              <button className="px-4 py-2 border-none bg-transparent text-indigo-600 text-base font-medium cursor-pointer rounded-md hover:bg-slate-50 transition-colors">
                Completed
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white border border-purple-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={(e) => handleTaskStatusChange(
                          task.id,
                          e.target.checked ? 'completed' : 'pending'
                        )}
                        className="w-[18px] h-[18px] cursor-pointer accent-primary"
                      />
                      <h3 className="text-lg font-semibold text-slate-900 m-0">{task.title}</h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusClasses(task.status)}`}
                    >
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-base text-indigo-600 leading-relaxed mb-4">{task.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 text-sm text-indigo-600">
                      <span className="font-medium text-primary">{task.group}</span>
                      <span>Due {formatDate(task.dueDate)}</span>
                    </div>
                    <div className="flex gap-1">
                      {task.assignedTo.map((assignee, idx) => (
                        <span
                          key={idx}
                          className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium"
                        >
                          {assignee[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

