import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ReactNode } from "react";
import { getCurrentAdmin, getRoleDisplayName, getRoleBadgeColor } from "@/lib/roleUtils";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function AdminPageHeader({ title, description, breadcrumbs, actions }: AdminPageHeaderProps) {
  const admin = getCurrentAdmin();

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4 flex-1">
          <SidebarTrigger data-testid="button-sidebar-toggle" className="text-gray-600 hover:text-gray-900" />
          <div className="flex-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb className="mb-2">
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <span key={index} className="flex items-center">
                      <BreadcrumbItem>
                        {crumb.href ? (
                          <BreadcrumbLink href={crumb.href} className="text-gray-600 hover:text-gray-900">
                            {crumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="text-gray-900 font-medium">{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </span>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {admin && (
                <Badge className={`${getRoleBadgeColor(admin.role)} border flex items-center gap-1.5 px-2.5 py-1`}>
                  <Shield className="w-3 h-3" />
                  <span className="text-xs font-semibold">{getRoleDisplayName(admin.role)}</span>
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-gray-600 mt-1 text-[17px] font-semibold">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
