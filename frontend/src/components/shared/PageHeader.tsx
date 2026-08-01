import React, { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  action?: ReactNode;
}

export default function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={bc.label || i}>
                <span className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  <span
                    className={bc.path ? "cursor-pointer hover:text-primary-600 transition-colors" : ""}
                    onClick={() => { if (bc.path) navigate(bc.path); }}
                  >
                    {bc.label}
                  </span>
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2 ml-4">{action}</div>}
    </div>
  );
}
