
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  User,
  Calendar,
  Building,
  TrendingUp,
  BookOpen,
  Users,
  Shield,
  DollarSign,
  Settings,
  Calculator,
  UserCog
} from "lucide-react";
import NotificationCenter from '@/components/NotificationCenter';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavigationItems = () => {
    if (user?.role === 'ADMIN') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Employee Management', href: '/admin/employees', icon: UserCog },
        { name: 'Department Management', href: '/admin/departments', icon: Building },
        { name: 'Branch Management', href: '/admin/branches', icon: Building },
        { name: 'Security', href: '/admin/security', icon: Shield },
        { name: 'Workflows', href: '/admin/workflows', icon: Settings },
        { name: 'Integrations', href: '/admin/integrations', icon: TrendingUp },
        { name: 'HR Management', href: '/hr/dashboard', icon: Building },
        { name: 'Payroll Management', href: '/payroll/dashboard', icon: Calculator },
      ];
    } else if (user?.role === 'HR_MANAGER') {
      return [
        { name: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard },
        { name: 'Employees', href: '/hr/employees', icon: Users },
        { name: 'Departments', href: '/hr/departments', icon: Building },
        { name: 'Branches', href: '/hr/branches', icon: Building },
        { name: 'Performance', href: '/hr/performance', icon: TrendingUp },
        { name: 'Training', href: '/hr/training', icon: BookOpen },
        { name: 'Leave Approvals', href: '/hr/leave', icon: Calendar },
        { name: 'Salary Advances', href: '/hr/salary-advances', icon: DollarSign },
        { name: 'Payroll Management', href: '/payroll/dashboard', icon: Calculator },
      ];
    } else if (user?.role === 'OPERATIONS_MANAGER') {
      return [
        { name: 'Dashboard', href: '/operations/dashboard', icon: LayoutDashboard },
        { name: 'My Profile', href: '/employee/profile', icon: User },
        { name: 'Leave Approvals', href: '/operations/leave', icon: Calendar },
        { name: 'Salary Advance Reviews', href: '/operations/salary-advances', icon: DollarSign },
        { name: 'Team Overview', href: '/operations/team', icon: Users },
        { name: 'My Leave Requests', href: '/operations/my-leave-requests', icon: Calendar },
        { name: 'My Salary Advance', href: '/operations/my-salary-advance', icon: DollarSign },
        { name: 'My Payroll', href: '/employee/payroll', icon: Calculator },
      ];
    } else {
      return [
        { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
        { name: 'My Profile', href: '/employee/profile', icon: User },
        { name: 'Leave Requests', href: '/employee/leave', icon: Calendar },
        { name: 'Salary Advance', href: '/employee/salary-advance', icon: DollarSign },
        { name: 'My Payroll', href: '/employee/payroll', icon: Calculator },
      ];
    }
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r flex-shrink-0 border-border flex flex-col">
        <div className="p-4 flex items-center justify-between">
          <span className="font-bold text-lg">Charlie's HRMS</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {navigationItems.map((item, index) => {
            const iconColors = [
              'text-blue-600',
              'text-emerald-600', 
              'text-purple-600',
              'text-orange-600',
              'text-cyan-600',
              'text-indigo-600',
              'text-green-600',
              'text-pink-600',
              'text-yellow-600',
              'text-red-600'
            ];
            const iconColor = iconColors[index % iconColors.length];
            
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "justify-start",
                  location.pathname.startsWith(item.href)
                    ? "bg-secondary hover:bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className={`mr-2 h-4 w-4 ${iconColor}`} />
                {item.name}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border p-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{title}</h1>
          
          <div className="flex items-center gap-2">
            {/* Notification Center */}
            <NotificationCenter />
            {/* Theme Toggle */}
            <ThemeToggle />
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profilePicture} alt={user?.firstName} />
                    <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.firstName} {user?.lastName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export { DashboardLayout };
