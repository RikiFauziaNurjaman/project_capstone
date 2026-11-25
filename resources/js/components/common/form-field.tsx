import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type FormFieldProps = {
    label: string;
    htmlFor?: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: ReactNode;
    className?: string;
};

export function FormField({
    label,
    htmlFor,
    required = false,
    hint,
    error,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={cn('grid gap-1.5', className)}>
            <Label
                htmlFor={htmlFor}
                className="text-[13px] font-medium text-slate-700 dark:text-slate-200"
            >
                {label}
                {required && (
                    <span
                        aria-hidden="true"
                        className="ml-0.5 text-destructive"
                    >
                        *
                    </span>
                )}
            </Label>

            {children}

            {error ? (
                <InputError message={error} className="text-xs" />
            ) : (
                hint && <p className="text-xs text-muted-foreground">{hint}</p>
            )}
        </div>
    );
}
