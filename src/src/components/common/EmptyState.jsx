import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction,
  className = '' 
}) {
  return (
    <Card className={`border-gray-200 ${className}`}>
      <CardContent className="p-12 text-center">
        {Icon && <Icon className="h-16 w-16 mx-auto mb-4 text-gray-400" />}
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{description}</p>
        {actionText && onAction && (
          <Button onClick={onAction} className="fusion-gradient">
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}