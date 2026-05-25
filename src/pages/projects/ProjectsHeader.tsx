import { ProjectTabs, ProjectTab } from './ProjectTabs';

interface Props {
  title: string;
  tabs: ProjectTab[];
  value: string;
  onChange: (v: string) => void;
}

export function ProjectsHeader({ title, tabs, value, onChange }: Props) {
  return (
    <div className="flex items-end justify-between border-b border-border">
      <div>
        <h1 className="text-2xl font-display font-bold mb-2">{title}</h1>
        <ProjectTabs tabs={tabs} value={value} onChange={onChange} />
      </div>
    </div>
  );
}
