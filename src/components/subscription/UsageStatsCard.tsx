 
'use client';

import { useRouter } from 'next/navigation';
import { HardDrive, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';

export function UsageStatsCard() {
  const router = useRouter();
  const {
    plan,
    monthlyLimit,
    documentsThisMonth,
    documentsRemaining,
    storageLimitGB,
    storageUsedGB,
    storageUsedPercent,
    isLoading,
  } = useSubscriptionAccess();

  if (isLoading) {
    return null;
  }

  const monthlyUsedPercent = monthlyLimit 
    ? Math.round((documentsThisMonth! / monthlyLimit) * 100)
    : 0;

  const isStorageAlmostFull = storageUsedPercent! >= 80;
  const isMonthlyAlmostFull = monthlyUsedPercent >= 80;
  const isStorageFull = storageUsedPercent! >= 100;
  const isMonthlyFull = monthlyUsedPercent >= 100;

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Plan Usage</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/pricing')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Upgrade Plan
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Critical warnings */}
        {(isStorageFull || isMonthlyFull) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isStorageFull && isMonthlyFull
                ? 'Storage and monthly upload limits reached! Upgrade to continue uploading.'
                : isStorageFull
                ? 'Storage limit reached! Upgrade your plan to upload more documents.'
                : 'Monthly upload limit reached! Wait until next month or upgrade your plan.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Warning for approaching limits */}
        {!isStorageFull && !isMonthlyFull && (isStorageAlmostFull || isMonthlyAlmostFull) && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {isStorageAlmostFull && isMonthlyAlmostFull
                ? 'You are approaching both your storage and monthly upload limits. Consider upgrading soon.'
                : isStorageAlmostFull
                ? `You have used ${storageUsedPercent}% of your storage. Consider upgrading soon.`
                : `You have uploaded ${documentsThisMonth} of ${monthlyLimit} documents this month.`}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                <span className="font-medium text-gray-900">Storage</span>
              </div>
              <span className="text-sm text-gray-600 capitalize">{plan} Plan</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {storageUsedGB?.toFixed(2)} GB / {storageLimitGB} GB
                </span>
                <span className={`font-medium ${
                  isStorageFull ? 'text-red-600' :
                  isStorageAlmostFull ? 'text-yellow-600' :
                  'text-gray-900'
                }`}>
                  {storageUsedPercent?.toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={Math.min(storageUsedPercent || 0, 100)} 
                className={`h-2 ${
                  isStorageFull ? 'bg-red-100' :
                  isStorageAlmostFull ? 'bg-yellow-100' :
                  ''
                }`}
              />
              {!isStorageFull && (
                <p className="text-xs text-gray-500">
                  {(storageLimitGB! - storageUsedGB!).toFixed(2)} GB remaining
                </p>
              )}
            </div>
          </div>

          {/* Monthly Upload Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium text-gray-900">Monthly Uploads</span>
              </div>
              <span className="text-sm text-gray-600">This Month</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {documentsThisMonth} / {monthlyLimit} documents
                </span>
                <span className={`font-medium ${
                  isMonthlyFull ? 'text-red-600' :
                  isMonthlyAlmostFull ? 'text-yellow-600' :
                  'text-gray-900'
                }`}>
                  {monthlyUsedPercent}%
                </span>
              </div>
              <Progress 
                value={Math.min(monthlyUsedPercent, 100)} 
                className={`h-2 ${
                  isMonthlyFull ? 'bg-red-100' :
                  isMonthlyAlmostFull ? 'bg-yellow-100' :
                  ''
                }`}
              />
              {!isMonthlyFull && (
                <p className="text-xs text-gray-500">
                  {documentsRemaining} documents remaining this month
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Plan comparison hint */}
        {(isStorageAlmostFull || isMonthlyAlmostFull) && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-2">
              Need more space or uploads?
            </p>
            <div className="grid grid-cols-3 gap-4 text-xs text-blue-800">
              <div>
                <p className="font-semibold">Core Plan</p>
                <p>200 docs/month</p>
                <p>15 GB storage</p>
              </div>
              <div>
                <p className="font-semibold">Pro Plan</p>
                <p>400 docs/month</p>
                <p>50 GB storage</p>
              </div>
              <div>
                <p className="font-semibold">Business Plan</p>
                <p>700 docs/month</p>
                <p>100 GB storage</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}