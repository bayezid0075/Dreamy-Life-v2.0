'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, Store, Package, Crown, ArrowRight } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { adminApi } from '@/lib/api';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getDashboardStats,
  });

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      description: 'Registered users',
      icon: Users,
      href: '/admin/users',
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      description: 'Currently active',
      icon: Users,
    },
    {
      title: 'Staff Members',
      value: stats?.staff_users || 0,
      description: 'Admin & staff',
      icon: Users,
    },
    {
      title: 'Total Vendors',
      value: stats?.total_vendors || 0,
      description: 'Registered vendors',
      icon: Store,
    },
    {
      title: 'Total Products',
      value: stats?.total_products || 0,
      description: 'Listed products',
      icon: Package,
    },
    {
      title: 'Memberships',
      value: stats?.total_memberships || 0,
      description: 'Active memberships',
      icon: Crown,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              {stat.href && (
                <Link href={stat.href}>
                  <Button variant="link" className="px-0 mt-2">
                    View all <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </div>
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : stats?.recent_users && stats.recent_users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent_users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono">#{user.id}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No recent users
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
